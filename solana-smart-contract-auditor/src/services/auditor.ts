import { ProgramFetcher } from './programFetcher';
import { BytecodeAnalyzer } from '../analyzers/bytecodeAnalyzer';
import { VulnerabilityDetector } from '../detectors/vulnerabilityDetector';
import { ReportGenerator } from '../reporters/reportGenerator';
import {
  AuditResult,
  AuditSummary,
  ReportOptions,
  ProgramInfo,
  BytecodeAnalysis,
} from '../types';
import { scoreToRiskLevel, calculateOverallScore, getProgramName } from '../utils/helpers';
import logger from '../utils/logger';

export class Auditor {
  private programFetcher: ProgramFetcher;
  private bytecodeAnalyzer: BytecodeAnalyzer;
  private vulnerabilityDetector: VulnerabilityDetector;
  private reportGenerator: ReportGenerator;

  constructor(rpcUrl: string, reportsDir: string) {
    this.programFetcher = new ProgramFetcher(rpcUrl);
    this.bytecodeAnalyzer = new BytecodeAnalyzer();
    this.vulnerabilityDetector = new VulnerabilityDetector();
    this.reportGenerator = new ReportGenerator(reportsDir);
  }

  /**
   * Perform full security audit on a program
   */
  async audit(
    programId: string,
    programName?: string,
    options: { fullAnalysis?: boolean; generateReport?: boolean; reportFormat?: 'json' | 'markdown' } = {}
  ): Promise<AuditResult> {
    const startTime = Date.now();
    logger.info(`Starting audit for program: ${programId}`);

    try {
      // 1. Fetch program information
      logger.info('Fetching program information...');
      const programInfo = await this.programFetcher.fetchProgramInfo(programId);

      // 2. Fetch and analyze bytecode
      logger.info('Analyzing bytecode...');
      const bytecode = await this.programFetcher.fetchProgramBytecode(programId);
      const bytecodeAnalysis = await this.bytecodeAnalyzer.analyze(programId, bytecode);

      // 3. Detect vulnerabilities
      logger.info('Running vulnerability detection...');
      const vulnerabilities = await this.vulnerabilityDetector.detectVulnerabilities(
        programInfo,
        bytecodeAnalysis
      );

      // 4. Run security checks
      logger.info('Running security checks...');
      const securityChecks = await this.vulnerabilityDetector.runSecurityChecks(
        programInfo,
        bytecodeAnalysis
      );

      // 5. Calculate summary
      const summary = this.calculateSummary(vulnerabilities, securityChecks);

      // 6. Calculate overall score
      const overallScore = calculateOverallScore(summary);
      const riskLevel = scoreToRiskLevel(overallScore);

      // 7. Generate recommendations
      const recommendations = this.generateRecommendations(
        vulnerabilities,
        securityChecks,
        programInfo
      );

      const auditDuration = Date.now() - startTime;

      const result: AuditResult = {
        programId,
        programName: programName || getProgramName(programId) || 'Unknown Program',
        timestamp: new Date().toISOString(),
        overallScore,
        riskLevel,
        summary,
        vulnerabilities,
        securityChecks,
        programInfo,
        recommendations,
        auditDuration,
      };

      logger.info(
        `Audit complete for ${programId}: Score ${overallScore}/100, Risk: ${riskLevel}`
      );

      // 8. Generate report if requested
      if (options.generateReport) {
        const reportPath = await this.reportGenerator.generateReport(result, {
          format: options.reportFormat || 'markdown',
          includeRawData: false,
          includeBytecodeAnalysis: false,
        });
        logger.info(`Report saved to: ${reportPath}`);
      }

      return result;
    } catch (error) {
      logger.error(`Audit failed for ${programId}:`, error);
      throw error;
    }
  }

  /**
   * Quick security check (faster, less comprehensive)
   */
  async quickCheck(programId: string): Promise<{
    programId: string;
    riskLevel: string;
    score: number;
    criticalIssues: number;
    isUpgradeable: boolean;
    upgradeAuthority: string | null;
  }> {
    logger.info(`Quick check for program: ${programId}`);

    const programInfo = await this.programFetcher.fetchProgramInfo(programId);
    const bytecode = await this.programFetcher.fetchProgramBytecode(programId);
    const bytecodeAnalysis = await this.bytecodeAnalyzer.analyze(programId, bytecode);

    const vulnerabilities = await this.vulnerabilityDetector.detectVulnerabilities(
      programInfo,
      bytecodeAnalysis
    );

    const criticalIssues = vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    const highIssues = vulnerabilities.filter(v => v.severity === 'HIGH').length;

    let score = 100;
    score -= criticalIssues * 25;
    score -= highIssues * 15;

    if (programInfo.isUpgradeable && programInfo.upgradeAuthority) {
      score -= 10;
    }

    score = Math.max(0, score);

    return {
      programId,
      riskLevel: scoreToRiskLevel(score),
      score,
      criticalIssues,
      isUpgradeable: programInfo.isUpgradeable,
      upgradeAuthority: programInfo.upgradeAuthority || null,
    };
  }

  /**
   * Generate report from existing audit result
   */
  async generateReport(
    audit: AuditResult,
    options: ReportOptions
  ): Promise<string> {
    return this.reportGenerator.generateReport(audit, options);
  }

  /**
   * Calculate audit summary
   */
  private calculateSummary(
    vulnerabilities: AuditResult['vulnerabilities'],
    securityChecks: AuditResult['securityChecks']
  ): AuditSummary {
    return {
      totalChecks: securityChecks.length,
      passed: securityChecks.filter(c => c.status === 'PASSED').length,
      warnings: securityChecks.filter(c => c.status === 'WARNING').length,
      failed: securityChecks.filter(c => c.status === 'FAILED').length,
      criticalIssues: vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
      highIssues: vulnerabilities.filter(v => v.severity === 'HIGH').length,
      mediumIssues: vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
      lowIssues: vulnerabilities.filter(v => v.severity === 'LOW').length,
      informational: vulnerabilities.filter(v => v.severity === 'INFORMATIONAL').length,
    };
  }

  /**
   * Generate recommendations based on findings
   */
  private generateRecommendations(
    vulnerabilities: AuditResult['vulnerabilities'],
    securityChecks: AuditResult['securityChecks'],
    programInfo: ProgramInfo
  ): string[] {
    const recommendations: string[] = [];

    // Critical vulnerabilities
    const criticalVulns = vulnerabilities.filter(v => v.severity === 'CRITICAL');
    if (criticalVulns.length > 0) {
      recommendations.push(
        `🔴 Address ${criticalVulns.length} critical vulnerabilities before deployment`
      );
    }

    // Upgrade authority
    if (programInfo.isUpgradeable && programInfo.upgradeAuthority) {
      recommendations.push(
        'Consider revoking upgrade authority if program is finalized, or use a multisig'
      );
    }

    // Failed checks
    const failedChecks = securityChecks.filter(c => c.status === 'FAILED');
    for (const check of failedChecks) {
      recommendations.push(`Fix failing check: ${check.name}`);
    }

    // High vulnerabilities
    const highVulns = vulnerabilities.filter(v => v.severity === 'HIGH');
    if (highVulns.length > 0) {
      recommendations.push(
        `Review ${highVulns.length} high-severity issues before mainnet deployment`
      );
    }

    // Deployer reputation
    if (
      programInfo.deployerHistory &&
      (programInfo.deployerHistory.reputation === 'NEW' ||
        programInfo.deployerHistory.reputation === 'UNKNOWN')
    ) {
      recommendations.push('Verify program deployer identity and track record');
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Program appears well-secured based on automated analysis');
      recommendations.push('Consider manual code review for additional assurance');
    }

    recommendations.push('Test thoroughly on devnet before mainnet deployment');

    return recommendations;
  }

  /**
   * Check if program exists
   */
  async programExists(programId: string): Promise<boolean> {
    return this.programFetcher.programExists(programId);
  }
}

export default Auditor;
