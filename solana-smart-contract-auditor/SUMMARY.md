# Solana Smart Contract Security Auditor - Project Summary

## Overview

A comprehensive automated security auditor for Solana smart contracts (programs). This tool performs deep bytecode analysis, vulnerability detection, and generates detailed security reports to help developers and security researchers identify potential risks in deployed programs.

## Key Features

### 1. BPF Bytecode Analysis
- Parses compiled Solana programs (BPF bytecode)
- Extracts instruction discriminators (Anchor-style)
- Identifies syscalls and cross-program invocations
- Analyzes account usage patterns
- Detects arithmetic operations and control flow

### 2. Vulnerability Detection (10+ Patterns)
Based on known Solana/Sealevel attack vectors:
- Missing signer checks
- Missing owner validation
- Integer overflow/underflow
- Unauthorized CPI (Cross-Program Invocation)
- Account confusion attacks
- Reentrancy vulnerabilities
- Uninitialized account usage
- PDA validation issues
- Arithmetic precision loss
- Privilege escalation

### 3. Security Checks
- Upgrade authority status
- Program data account integrity
- Deployer wallet reputation
- Account validation levels
- State modification patterns

### 4. Report Generation
- JSON format for programmatic access
- Markdown format for human readability
- Risk scoring (0-100)
- Severity classification (Critical, High, Medium, Low, Informational)
- Actionable recommendations

### 5. REST API
- Audit endpoints for on-demand analysis
- Quick check for rapid assessment
- History and statistics queries
- OpenAPI documentation

### 6. CLI Tool
- Command-line interface for audits
- Multiple output formats
- Database integration

### 7. Continuous Monitoring
- Watch programs for upgrades
- Alert on bytecode changes
- Automatic re-audit on updates

## Installation

```bash
# Clone repository
git clone https://github.com/pranay123-stack/solana-smart-contract-auditor.git
cd solana-smart-contract-auditor

# Install dependencies
npm install

# Build
npm run build
```

## Configuration

Create `.env` file:
```env
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
DATABASE_PATH=./data/audits.db
REPORTS_DIR=./reports
PORT=3002
NODE_ENV=production
```

## Usage Examples

### CLI Usage

```bash
# Full security audit
npm run cli -- audit TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA --name "Token Program"

# Quick check
npm run cli -- quick 9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin

# List recent audits
npm run cli -- list --limit 20

# View statistics
npm run cli -- stats
```

### API Usage

Start the server:
```bash
npm start
# or
npm run api
```

#### Audit a Program
```bash
curl -X POST http://localhost:3002/api/audit \
  -H "Content-Type: application/json" \
  -d '{
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "programName": "SPL Token Program",
    "options": {
      "generateReport": true,
      "reportFormat": "markdown"
    }
  }'
```

Response:
```json
{
  "success": true,
  "audit": {
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "programName": "SPL Token Program",
    "overallScore": 85,
    "riskLevel": "LOW",
    "summary": {
      "totalChecks": 12,
      "passed": 10,
      "warnings": 2,
      "failed": 0,
      "criticalIssues": 0,
      "highIssues": 0,
      "mediumIssues": 1,
      "lowIssues": 2,
      "informational": 3
    },
    "vulnerabilities": [...],
    "securityChecks": [...],
    "recommendations": [...]
  }
}
```

#### Quick Check
```bash
curl http://localhost:3002/api/quick/9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin
```

Response:
```json
{
  "success": true,
  "result": {
    "programId": "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
    "score": 72,
    "riskLevel": "LOW",
    "criticalIssues": 0,
    "isUpgradeable": true,
    "upgradeAuthority": "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"
  }
}
```

#### Get Program Info
```bash
curl http://localhost:3002/api/program/TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
```

#### List Recent Audits
```bash
curl http://localhost:3002/api/audits?limit=10
```

#### Get Audit by ID
```bash
curl http://localhost:3002/api/audit/abc123
```

### Continuous Monitoring

```bash
# Start monitoring
npm run monitor
```

Programmatic usage:
```typescript
import { ProgramMonitor } from './monitoring/monitor';

const monitor = new ProgramMonitor(
  'https://api.mainnet-beta.solana.com',
  './data/audits.db',
  './reports'
);

// Add program to watch
await monitor.addProgram('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', 'Token Program');

// Start monitoring (checks every 5 minutes by default)
await monitor.start();

// Listen for events
monitor.on('upgrade', (alert) => {
  console.log(`Program ${alert.programId} was upgraded!`);
  console.log(`New score: ${alert.newScore}, Previous: ${alert.previousScore}`);
});

monitor.on('alert', (alert) => {
  console.log(`Security alert: ${alert.message}`);
});
```

## Testing

```bash
# Run tests
npm test

# With coverage
npm run test:coverage
```

## Example Audit Output (Markdown)

```markdown
# Security Audit Report

## Program Information
- **Program ID:** TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
- **Name:** SPL Token Program
- **Size:** 165,432 bytes
- **Upgradeable:** No

## Security Score
**85/100** - LOW Risk

## Findings Summary
| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 1 |
| Low | 2 |
| Info | 3 |

## Vulnerabilities
### [MEDIUM] Heavy Arithmetic Operations
Detected 45 arithmetic operations that could be susceptible to overflow...
**Recommendation:** Ensure all arithmetic uses checked_* methods

## Security Checks
| Check | Status | Details |
|-------|--------|---------|
| Signer Validation | PASSED | Proper signer checks detected |
| Owner Validation | PASSED | Owner verification present |
| Upgrade Authority | PASSED | Program is immutable |

## Recommendations
1. Consider manual code review for additional assurance
2. Test thoroughly on devnet before mainnet deployment
```

## Architecture

```
src/
├── analyzers/
│   └── bytecodeAnalyzer.ts    # BPF bytecode parsing
├── api/
│   └── server.ts              # REST API server
├── db/
│   └── database.ts            # SQLite persistence
├── detectors/
│   └── vulnerabilityDetector.ts  # Vulnerability patterns
├── monitoring/
│   └── monitor.ts             # Continuous monitoring
├── reporters/
│   └── reportGenerator.ts     # Report generation
├── services/
│   ├── auditor.ts            # Main auditor orchestration
│   └── programFetcher.ts     # Solana RPC interactions
├── types/
│   └── index.ts              # TypeScript definitions
├── utils/
│   ├── helpers.ts            # Utility functions
│   └── logger.ts             # Winston logger
├── cli.ts                    # CLI entry point
└── index.ts                  # API entry point
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/audit | Run full security audit |
| GET | /api/quick/:programId | Quick security check |
| GET | /api/program/:programId | Get program information |
| GET | /api/audits | List recent audits |
| GET | /api/audit/:id | Get specific audit |
| DELETE | /api/audit/:id | Delete audit record |
| GET | /api/stats | Get auditor statistics |
| POST | /api/report/:id | Generate report from audit |
| GET | /health | Health check |

## Technology Stack

- **Runtime:** Node.js with TypeScript
- **Blockchain:** @solana/web3.js for Solana RPC
- **API:** Express.js with CORS, rate limiting
- **Database:** SQLite (better-sqlite3)
- **CLI:** Commander.js with chalk, ora
- **Logging:** Winston with daily rotation
- **Testing:** Jest with coverage

## Security Considerations

This tool performs static analysis on compiled bytecode. It cannot:
- Detect all vulnerabilities (no tool can)
- Analyze runtime behavior
- Access private/encrypted data
- Replace manual security audits

Always combine automated analysis with:
- Manual code review
- Fuzzing and testing
- Third-party audits for critical programs

## License

MIT License
