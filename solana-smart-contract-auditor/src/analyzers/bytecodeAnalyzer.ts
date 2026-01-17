import {
  BytecodeAnalysis,
  InstructionInfo,
  CrossProgramCall,
  AccountUsage,
  DetectedPattern,
  RiskLevel,
} from '../types';
import { calculateHash, KNOWN_PROGRAMS } from '../utils/helpers';
import logger from '../utils/logger';

// BPF instruction opcodes (simplified)
const BPF_OPCODES = {
  CALL: 0x85,
  EXIT: 0x95,
  JMP: 0x05,
  JEQ: 0x15,
  JNE: 0x55,
  JSGT: 0x65,
  JSGE: 0x75,
  JLT: 0x0d,
  JLE: 0x1d,
  LD: 0x18,
  ST: 0x62,
  STX: 0x63,
  ADD: 0x07,
  SUB: 0x17,
  MUL: 0x27,
  DIV: 0x37,
};

// Known Solana syscalls
const SOLANA_SYSCALLS: Record<number, string> = {
  0x71e3cf81: 'sol_log_',
  0xb9640a82: 'sol_panic_',
  0x83f00e8f: 'sol_sha256',
  0xc5d3c4a4: 'sol_invoke_signed',
  0x5c2a3173: 'sol_create_program_address',
  0xd56b5fe9: 'sol_try_find_program_address',
  0x717cc4a3: 'sol_memcpy_',
  0x3770fb22: 'sol_memset_',
  0x98f6b2f8: 'sol_memmove_',
  0xa22b9c85: 'sol_memcmp_',
};

export class BytecodeAnalyzer {
  /**
   * Analyze program bytecode
   */
  async analyze(programId: string, bytecode: Buffer): Promise<BytecodeAnalysis> {
    logger.info(`Analyzing bytecode for ${programId}, size: ${bytecode.length} bytes`);

    const hash = calculateHash(bytecode);
    const instructions = this.extractInstructions(bytecode);
    const crossProgramCalls = this.detectCrossProgramCalls(bytecode);
    const syscalls = this.extractSyscalls(bytecode);
    const patterns = this.detectPatterns(bytecode);
    const accountsUsed = this.analyzeAccountUsage(bytecode);

    return {
      programId,
      size: bytecode.length,
      hash,
      instructions,
      crossProgramCalls,
      accountsUsed,
      syscalls,
      patterns,
    };
  }

  /**
   * Extract instruction information from bytecode
   */
  private extractInstructions(bytecode: Buffer): InstructionInfo[] {
    const instructions: InstructionInfo[] = [];

    // Look for Anchor discriminators (8-byte instruction identifiers)
    const anchorDiscriminators = this.findAnchorDiscriminators(bytecode);

    for (let i = 0; i < anchorDiscriminators.length; i++) {
      const disc = anchorDiscriminators[i];
      instructions.push({
        index: i,
        name: `instruction_${i}`,
        discriminator: disc.hex,
        accountsRequired: this.estimateAccountsRequired(bytecode, disc.offset),
        hasSignerCheck: this.checkForSignerValidation(bytecode, disc.offset),
        hasOwnerCheck: this.checkForOwnerValidation(bytecode, disc.offset),
        modifiesState: this.checkForStateModification(bytecode, disc.offset),
      });
    }

    // If no Anchor discriminators found, analyze raw BPF
    if (instructions.length === 0) {
      instructions.push({
        index: 0,
        name: 'main_entry',
        accountsRequired: this.countAccountAccesses(bytecode),
        hasSignerCheck: this.hasSignerCheckGlobal(bytecode),
        hasOwnerCheck: this.hasOwnerCheckGlobal(bytecode),
        modifiesState: true,
      });
    }

    return instructions;
  }

  /**
   * Find Anchor-style discriminators
   */
  private findAnchorDiscriminators(bytecode: Buffer): { hex: string; offset: number }[] {
    const discriminators: { hex: string; offset: number }[] = [];
    const seen = new Set<string>();

    // Anchor discriminators are typically compared at instruction entry points
    // Look for 8-byte comparison patterns
    for (let i = 0; i < bytecode.length - 16; i++) {
      // Look for comparison instruction followed by 8 bytes
      if (this.looksLikeDiscriminatorCheck(bytecode, i)) {
        const disc = bytecode.slice(i + 8, i + 16).toString('hex');
        if (!seen.has(disc) && !this.isCommonPattern(disc)) {
          seen.add(disc);
          discriminators.push({ hex: disc, offset: i });
        }
      }
    }

    return discriminators.slice(0, 20); // Limit to 20 instructions
  }

  /**
   * Check if bytes look like discriminator check
   */
  private looksLikeDiscriminatorCheck(bytecode: Buffer, offset: number): boolean {
    // Simplified heuristic - look for load + compare patterns
    if (offset + 16 > bytecode.length) return false;

    const byte1 = bytecode[offset];
    const byte2 = bytecode[offset + 1];

    // Look for load or comparison opcodes
    return (
      byte1 === BPF_OPCODES.LD ||
      byte1 === BPF_OPCODES.JEQ ||
      byte1 === BPF_OPCODES.JNE ||
      (byte1 === 0x18 && byte2 === 0x01) // Common load pattern
    );
  }

  /**
   * Check if pattern is too common (likely not a discriminator)
   */
  private isCommonPattern(hex: string): boolean {
    const common = [
      '0000000000000000',
      'ffffffffffffffff',
      '0101010101010101',
    ];
    return common.includes(hex);
  }

  /**
   * Detect cross-program invocations
   */
  private detectCrossProgramCalls(bytecode: Buffer): CrossProgramCall[] {
    const calls: CrossProgramCall[] = [];
    const bytecodeHex = bytecode.toString('hex');

    // Look for known program IDs in the bytecode
    for (const [programId, programName] of Object.entries(KNOWN_PROGRAMS)) {
      try {
        // Convert base58 to bytes and search
        const programBytes = this.base58ToBytes(programId);
        if (programBytes) {
          const searchHex = programBytes.toString('hex');
          if (bytecodeHex.includes(searchHex)) {
            let riskLevel: RiskLevel = 'LOW';
            let notes = `Calls ${programName}`;

            // Assess risk based on program type
            if (programName.includes('Token')) {
              riskLevel = 'MEDIUM';
              notes += ' - Token operations detected';
            }

            calls.push({
              targetProgram: programId,
              instruction: 'invoke',
              riskLevel,
              notes,
            });
          }
        }
      } catch {
        // Skip invalid addresses
      }
    }

    // Check for sol_invoke_signed syscall
    if (this.containsSyscall(bytecode, 0xc5d3c4a4)) {
      if (calls.length === 0) {
        calls.push({
          targetProgram: 'unknown',
          instruction: 'sol_invoke_signed',
          riskLevel: 'MEDIUM',
          notes: 'CPI detected but target program not identified',
        });
      }
    }

    return calls;
  }

  /**
   * Convert base58 to bytes
   */
  private base58ToBytes(address: string): Buffer | null {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    try {
      let num = BigInt(0);
      for (const char of address) {
        const index = ALPHABET.indexOf(char);
        if (index === -1) return null;
        num = num * BigInt(58) + BigInt(index);
      }

      const bytes: number[] = [];
      while (num > 0) {
        bytes.unshift(Number(num & BigInt(0xff)));
        num = num >> BigInt(8);
      }

      // Add leading zeros
      for (const char of address) {
        if (char === '1') bytes.unshift(0);
        else break;
      }

      return Buffer.from(bytes);
    } catch {
      return null;
    }
  }

  /**
   * Extract syscalls used by the program
   */
  private extractSyscalls(bytecode: Buffer): string[] {
    const syscalls: string[] = [];

    for (const [hash, name] of Object.entries(SOLANA_SYSCALLS)) {
      if (this.containsSyscall(bytecode, Number(hash))) {
        syscalls.push(name);
      }
    }

    return syscalls;
  }

  /**
   * Check if bytecode contains syscall
   */
  private containsSyscall(bytecode: Buffer, syscallHash: number): boolean {
    const hashBytes = Buffer.alloc(4);
    hashBytes.writeUInt32LE(syscallHash);
    return bytecode.includes(hashBytes);
  }

  /**
   * Detect patterns in bytecode
   */
  private detectPatterns(bytecode: Buffer): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    // Check for arithmetic operations (potential overflow)
    const addCount = this.countOpcode(bytecode, BPF_OPCODES.ADD);
    const mulCount = this.countOpcode(bytecode, BPF_OPCODES.MUL);

    if (addCount + mulCount > 20) {
      patterns.push({
        name: 'Heavy Arithmetic',
        type: 'SUSPICIOUS',
        description: 'High number of arithmetic operations - verify overflow checks',
        occurrences: addCount + mulCount,
      });
    }

    // Check for division (potential division by zero)
    const divCount = this.countOpcode(bytecode, BPF_OPCODES.DIV);
    if (divCount > 0) {
      patterns.push({
        name: 'Division Operations',
        type: 'SUSPICIOUS',
        description: 'Division operations found - ensure zero-division checks',
        occurrences: divCount,
      });
    }

    // Check for conditional jumps (complex logic)
    const jumpCount = this.countOpcode(bytecode, BPF_OPCODES.JEQ) +
                      this.countOpcode(bytecode, BPF_OPCODES.JNE);
    if (jumpCount > 50) {
      patterns.push({
        name: 'Complex Control Flow',
        type: 'SAFE',
        description: 'Many conditional branches - indicates thorough validation',
        occurrences: jumpCount,
      });
    }

    // Check for memory operations
    const memOps = this.extractSyscalls(bytecode).filter(s =>
      s.startsWith('sol_mem')
    ).length;

    if (memOps > 0) {
      patterns.push({
        name: 'Memory Operations',
        type: 'SAFE',
        description: 'Uses Solana memory syscalls',
        occurrences: memOps,
      });
    }

    return patterns;
  }

  /**
   * Count occurrences of opcode
   */
  private countOpcode(bytecode: Buffer, opcode: number): number {
    let count = 0;
    for (let i = 0; i < bytecode.length; i += 8) {
      if (bytecode[i] === opcode) count++;
    }
    return count;
  }

  /**
   * Analyze account usage patterns
   */
  private analyzeAccountUsage(bytecode: Buffer): AccountUsage[] {
    const accounts: AccountUsage[] = [];

    // Estimate based on common patterns
    // In a real implementation, this would do deeper analysis
    const accountCount = this.countAccountAccesses(bytecode);

    for (let i = 0; i < Math.min(accountCount, 10); i++) {
      accounts.push({
        index: i,
        isSigner: i === 0, // First account is typically signer
        isWritable: i < 3, // First few accounts are typically writable
        isOptional: i > 5,
        validationLevel: i < 3 ? 'STRICT' : 'BASIC',
      });
    }

    return accounts;
  }

  /**
   * Estimate accounts required
   */
  private estimateAccountsRequired(bytecode: Buffer, offset: number): number {
    // Simplified estimation
    return Math.min(this.countAccountAccesses(bytecode), 10);
  }

  /**
   * Count account accesses
   */
  private countAccountAccesses(bytecode: Buffer): number {
    // Look for account info load patterns
    // This is a heuristic - real analysis would be more sophisticated
    let count = 0;
    for (let i = 0; i < bytecode.length - 8; i++) {
      // Look for account array indexing patterns
      if (bytecode[i] === 0x79 && bytecode[i + 1] < 20) {
        count++;
      }
    }
    return Math.max(1, Math.min(count, 20));
  }

  /**
   * Check for signer validation
   */
  private checkForSignerValidation(bytecode: Buffer, offset: number): boolean {
    return this.hasSignerCheckGlobal(bytecode);
  }

  /**
   * Global signer check
   */
  private hasSignerCheckGlobal(bytecode: Buffer): boolean {
    // Look for is_signer field access pattern
    // AccountInfo.is_signer is typically at a known offset
    const signerPatterns = [
      Buffer.from([0x71, 0x00, 0x00, 0x00, 0x08]), // Load bool at offset 8
      Buffer.from([0x79, 0x00, 0x08, 0x00, 0x00]), // Load from struct + 8
    ];

    return signerPatterns.some(p => bytecode.includes(p));
  }

  /**
   * Check for owner validation
   */
  private checkForOwnerValidation(bytecode: Buffer, offset: number): boolean {
    return this.hasOwnerCheckGlobal(bytecode);
  }

  /**
   * Global owner check
   */
  private hasOwnerCheckGlobal(bytecode: Buffer): boolean {
    // Look for owner comparison patterns
    // Owner is a 32-byte public key at known offset in AccountInfo
    const ownerCheckPattern = Buffer.from([0xbf, 0x00, 0x00, 0x00]); // Common comparison setup
    return bytecode.includes(ownerCheckPattern);
  }

  /**
   * Check for state modification
   */
  private checkForStateModification(bytecode: Buffer, offset: number): boolean {
    // Look for store instructions near the offset
    const windowSize = 200;
    const start = Math.max(0, offset);
    const end = Math.min(bytecode.length, offset + windowSize);
    const window = bytecode.slice(start, end);

    return (
      this.countOpcode(window, BPF_OPCODES.ST) > 0 ||
      this.countOpcode(window, BPF_OPCODES.STX) > 0
    );
  }
}

export default BytecodeAnalyzer;
