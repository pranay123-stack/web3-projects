import fs from 'fs';
import path from 'path';
import {
  AuditResult,
  ReportOptions,
  Vulnerability,
  SecurityCheck,
} from '../types';
import { formatBytes, formatDuration, getCweUrl, truncateAddress } from '../utils/helpers';
import logger from '../utils/logger';

export class ReportGenerator {
  private reportsDir: string;

  constructor(reportsDir: string) {
    this.reportsDir = reportsDir;

    // Ensure reports directory exists
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
  }

  /**
   * Generate audit report in specified format
   */
  async generateReport(
    audit: AuditResult,
    options: ReportOptions
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit_${truncateAddress(audit.programId)}_${timestamp}`;

    let content: string;
    let ext: string;

    switch (options.format) {
      case 'json':
        content = this.generateJSON(audit, options);
        ext = 'json';
        break;
      case 'markdown':
        content = this.generateMarkdown(audit, options);
        ext = 'md';
        break;
      case 'html':
        content = this.generateHTML(audit, options);
        ext = 'html';
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }

    const outputPath = options.outputPath || path.join(this.reportsDir, `${filename}.${ext}`);

    fs.writeFileSync(outputPath, content);
    logger.info(`Report generated: ${outputPath}`);

    return outputPath;
  }

  /**
   * Generate JSON report
   */
  private generateJSON(audit: AuditResult, options: ReportOptions): string {
    const report = {
      ...audit,
      generatedAt: new Date().toISOString(),
      reportVersion: '1.0.0',
    };

    if (!options.includeRawData) {
      // Remove raw bytecode data
      delete (report as any).bytecodeAnalysis;
    }

    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdown(audit: AuditResult, options: ReportOptions): string {
    const lines: string[] = [];

    // Header
    lines.push(`# Smart Contract Security Audit Report`);
    lines.push('');
    lines.push(`**Program:** \`${audit.programId}\``);
    lines.push(`**Name:** ${audit.programName}`);
    lines.push(`**Date:** ${new Date(audit.timestamp).toLocaleString()}`);
    lines.push(`**Audit Duration:** ${formatDuration(audit.auditDuration)}`);
    lines.push('');

    // Executive Summary
    lines.push('## Executive Summary');
    lines.push('');
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| **Overall Score** | ${audit.overallScore}/100 |`);
    lines.push(`| **Risk Level** | ${this.getRiskBadge(audit.riskLevel)} |`);
    lines.push(`| **Critical Issues** | ${audit.summary.criticalIssues} |`);
    lines.push(`| **High Issues** | ${audit.summary.highIssues} |`);
    lines.push(`| **Medium Issues** | ${audit.summary.mediumIssues} |`);
    lines.push(`| **Low Issues** | ${audit.summary.lowIssues} |`);
    lines.push('');

    // Risk Gauge
    lines.push('### Risk Assessment');
    lines.push('');
    lines.push(this.generateRiskGauge(audit.overallScore));
    lines.push('');

    // Program Information
    lines.push('## Program Information');
    lines.push('');
    lines.push(`| Property | Value |`);
    lines.push(`|----------|-------|`);
    lines.push(`| Program ID | \`${audit.programInfo.programId}\` |`);
    lines.push(`| Owner | \`${audit.programInfo.owner}\` |`);
    lines.push(`| Executable | ${audit.programInfo.executable ? 'Yes' : 'No'} |`);
    lines.push(`| Size | ${formatBytes(audit.programInfo.dataLength)} |`);
    lines.push(`| Upgradeable | ${audit.programInfo.isUpgradeable ? '**Yes**' : 'No'} |`);
    if (audit.programInfo.upgradeAuthority) {
      lines.push(`| Upgrade Authority | \`${audit.programInfo.upgradeAuthority}\` |`);
    }
    lines.push('');

    // Vulnerabilities
    lines.push('## Vulnerabilities Found');
    lines.push('');

    if (audit.vulnerabilities.length === 0) {
      lines.push('No vulnerabilities detected.');
    } else {
      for (const vuln of audit.vulnerabilities) {
        lines.push(this.formatVulnerability(vuln));
        lines.push('');
      }
    }

    // Security Checks
    lines.push('## Security Checks');
    lines.push('');
    lines.push('| Check | Status | Severity | Description |');
    lines.push('|-------|--------|----------|-------------|');
    for (const check of audit.securityChecks) {
      lines.push(this.formatSecurityCheckRow(check));
    }
    lines.push('');

    // Recommendations
    lines.push('## Recommendations');
    lines.push('');
    for (const rec of audit.recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push('');

    // Footer
    lines.push('---');
    lines.push('');
    lines.push('*This report was generated automatically by the Solana Smart Contract Auditor.*');
    lines.push('*It should be used as a starting point and supplemented with manual review.*');
    lines.push('');
    lines.push(`Report generated: ${new Date().toISOString()}`);

    return lines.join('\n');
  }

  /**
   * Generate HTML report
   */
  private generateHTML(audit: AuditResult, options: ReportOptions): string {
    const markdown = this.generateMarkdown(audit, options);

    // Simple HTML wrapper (could use marked for full conversion)
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audit Report - ${audit.programName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1, h2, h3 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #f5f5f5; }
        code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }
        .critical { background: #fee; color: #c00; }
        .high { background: #fff3e0; color: #e65100; }
        .medium { background: #fff8e1; color: #f57f17; }
        .low { background: #e3f2fd; color: #1976d2; }
        .safe { background: #e8f5e9; color: #2e7d32; }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
        }
        pre { background: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <pre>${this.escapeHtml(markdown)}</pre>
    </div>
</body>
</html>`;
  }

  /**
   * Format vulnerability for Markdown
   */
  private formatVulnerability(vuln: Vulnerability): string {
    const lines: string[] = [];
    const severityBadge = this.getSeverityBadge(vuln.severity);

    lines.push(`### ${severityBadge} ${vuln.name}`);
    lines.push('');
    lines.push(`**Category:** ${vuln.category}`);
    lines.push(`**Confidence:** ${(vuln.confidence * 100).toFixed(0)}%`);
    if (vuln.cweId) {
      lines.push(`**CWE:** [${vuln.cweId}](${getCweUrl(vuln.cweId)})`);
    }
    lines.push('');
    lines.push(`**Description:**`);
    lines.push(vuln.description);
    lines.push('');
    lines.push(`**Impact:**`);
    lines.push(vuln.impact);
    lines.push('');
    lines.push(`**Recommendation:**`);
    lines.push(vuln.recommendation);

    if (vuln.location) {
      lines.push('');
      lines.push(`**Location:**`);
      if (vuln.location.instruction) {
        lines.push(`- Instruction: \`${vuln.location.instruction}\``);
      }
    }

    if (vuln.references.length > 0) {
      lines.push('');
      lines.push(`**References:**`);
      for (const ref of vuln.references) {
        lines.push(`- ${ref}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Format security check for table row
   */
  private formatSecurityCheckRow(check: SecurityCheck): string {
    const status = this.getStatusIcon(check.status);
    const severity = this.getSeverityBadge(check.severity);
    return `| ${check.name} | ${status} | ${severity} | ${check.description} |`;
  }

  /**
   * Get risk badge
   */
  private getRiskBadge(risk: string): string {
    const badges: Record<string, string> = {
      SAFE: '🟢 SAFE',
      LOW: '🟡 LOW',
      MEDIUM: '🟠 MEDIUM',
      HIGH: '🔴 HIGH',
      CRITICAL: '⛔ CRITICAL',
    };
    return badges[risk] || risk;
  }

  /**
   * Get severity badge
   */
  private getSeverityBadge(severity: string): string {
    const badges: Record<string, string> = {
      CRITICAL: '🔴 Critical',
      HIGH: '🟠 High',
      MEDIUM: '🟡 Medium',
      LOW: '🔵 Low',
      INFORMATIONAL: 'ℹ️ Info',
    };
    return badges[severity] || severity;
  }

  /**
   * Get status icon
   */
  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      PASSED: '✅',
      WARNING: '⚠️',
      FAILED: '❌',
      SKIPPED: '⏭️',
      NOT_APPLICABLE: '➖',
    };
    return icons[status] || status;
  }

  /**
   * Generate ASCII risk gauge
   */
  private generateRiskGauge(score: number): string {
    const filled = Math.round(score / 10);
    const empty = 10 - filled;
    const gauge = '█'.repeat(filled) + '░'.repeat(empty);

    let label: string;
    if (score >= 90) label = 'SAFE';
    else if (score >= 70) label = 'LOW RISK';
    else if (score >= 50) label = 'MEDIUM RISK';
    else if (score >= 30) label = 'HIGH RISK';
    else label = 'CRITICAL';

    return `\`[${gauge}]\` ${score}/100 - **${label}**`;
  }

  /**
   * Escape HTML entities
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

export default ReportGenerator;
