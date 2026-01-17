#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import dotenv from 'dotenv';
import { Auditor } from './services/auditor';
import { DatabaseService } from './db/database';
import { isValidSolanaAddress, formatBytes, formatDuration } from './utils/helpers';

dotenv.config();

const program = new Command();

program
  .name('solana-auditor')
  .description('Solana Smart Contract Security Auditor CLI')
  .version('1.0.0');

// Audit command
program
  .command('audit <programId>')
  .description('Run security audit on a Solana program')
  .option('-n, --name <name>', 'Program name')
  .option('-f, --format <format>', 'Report format (json, markdown)', 'markdown')
  .option('--no-report', 'Skip report generation')
  .action(async (programId: string, options) => {
    if (!isValidSolanaAddress(programId)) {
      console.error(chalk.red('Invalid Solana program address'));
      process.exit(1);
    }

    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const reportsDir = process.env.REPORTS_DIR || './reports';

    const spinner = ora('Starting security audit...').start();

    try {
      const auditor = new Auditor(rpcUrl, reportsDir);

      spinner.text = 'Fetching program information...';
      const result = await auditor.audit(programId, options.name, {
        generateReport: options.report,
        reportFormat: options.format,
      });

      spinner.succeed('Audit complete!');

      // Display results
      console.log('\n' + chalk.bold('═══════════════════════════════════════════════════════'));
      console.log(chalk.bold.cyan('  SECURITY AUDIT REPORT'));
      console.log(chalk.bold('═══════════════════════════════════════════════════════\n'));

      // Program info
      console.log(chalk.bold('Program Information:'));
      console.log(`  ${chalk.gray('ID:')} ${result.programId}`);
      console.log(`  ${chalk.gray('Name:')} ${result.programName}`);
      console.log(`  ${chalk.gray('Size:')} ${formatBytes(result.programInfo.dataLength)}`);
      console.log(`  ${chalk.gray('Upgradeable:')} ${result.programInfo.isUpgradeable ? chalk.yellow('Yes') : chalk.green('No')}`);
      if (result.programInfo.upgradeAuthority) {
        console.log(`  ${chalk.gray('Authority:')} ${result.programInfo.upgradeAuthority}`);
      }

      // Overall score
      console.log('\n' + chalk.bold('Security Score:'));
      const scoreColor = result.overallScore >= 70 ? chalk.green : result.overallScore >= 50 ? chalk.yellow : chalk.red;
      console.log(`  ${scoreColor.bold(`${result.overallScore}/100`)} - ${getRiskLabel(result.riskLevel)}`);

      // Summary table
      console.log('\n' + chalk.bold('Findings Summary:'));
      const summaryTable = new Table({
        head: ['Severity', 'Count'],
        style: { head: ['cyan'] },
      });
      summaryTable.push(
        [chalk.red('Critical'), result.summary.criticalIssues.toString()],
        [chalk.yellow('High'), result.summary.highIssues.toString()],
        [chalk.magenta('Medium'), result.summary.mediumIssues.toString()],
        [chalk.blue('Low'), result.summary.lowIssues.toString()],
        [chalk.gray('Info'), result.summary.informational.toString()]
      );
      console.log(summaryTable.toString());

      // Vulnerabilities
      if (result.vulnerabilities.length > 0) {
        console.log('\n' + chalk.bold('Vulnerabilities Found:'));
        for (const vuln of result.vulnerabilities) {
          const sevColor = getSeverityColor(vuln.severity);
          console.log(`\n  ${sevColor(`[${vuln.severity}]`)} ${chalk.bold(vuln.name)}`);
          console.log(`  ${chalk.gray(vuln.description)}`);
          console.log(`  ${chalk.cyan('→')} ${vuln.recommendation}`);
        }
      }

      // Security checks
      console.log('\n' + chalk.bold('Security Checks:'));
      const checksTable = new Table({
        head: ['Check', 'Status', 'Details'],
        style: { head: ['cyan'] },
        colWidths: [30, 10, 50],
        wordWrap: true,
      });

      for (const check of result.securityChecks) {
        const status = getStatusIcon(check.status);
        checksTable.push([check.name, status, check.description]);
      }
      console.log(checksTable.toString());

      // Recommendations
      console.log('\n' + chalk.bold('Recommendations:'));
      for (const rec of result.recommendations) {
        console.log(`  ${chalk.cyan('•')} ${rec}`);
      }

      console.log(`\n${chalk.gray(`Audit duration: ${formatDuration(result.auditDuration)}`)}`);

    } catch (error: any) {
      spinner.fail('Audit failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Quick check command
program
  .command('quick <programId>')
  .description('Quick security check (faster, less comprehensive)')
  .action(async (programId: string) => {
    if (!isValidSolanaAddress(programId)) {
      console.error(chalk.red('Invalid Solana program address'));
      process.exit(1);
    }

    const spinner = ora('Running quick check...').start();

    try {
      const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
      const auditor = new Auditor(rpcUrl, './reports');

      const result = await auditor.quickCheck(programId);
      spinner.succeed('Quick check complete!');

      console.log('\n' + chalk.bold('Quick Security Check:'));
      console.log(`  ${chalk.gray('Program:')} ${programId}`);

      const scoreColor = result.score >= 70 ? chalk.green : result.score >= 50 ? chalk.yellow : chalk.red;
      console.log(`  ${chalk.gray('Score:')} ${scoreColor.bold(`${result.score}/100`)}`);
      console.log(`  ${chalk.gray('Risk Level:')} ${getRiskLabel(result.riskLevel)}`);
      console.log(`  ${chalk.gray('Critical Issues:')} ${result.criticalIssues > 0 ? chalk.red(result.criticalIssues) : chalk.green(result.criticalIssues)}`);
      console.log(`  ${chalk.gray('Upgradeable:')} ${result.isUpgradeable ? chalk.yellow('Yes') : chalk.green('No')}`);

      if (result.upgradeAuthority) {
        console.log(`  ${chalk.gray('Authority:')} ${result.upgradeAuthority}`);
      }

    } catch (error: any) {
      spinner.fail('Quick check failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// List audits command
program
  .command('list')
  .description('List recent audits')
  .option('-l, --limit <number>', 'Number of audits to show', '10')
  .action(async (options) => {
    try {
      const dbPath = process.env.DATABASE_PATH || './data/audits.db';
      const db = new DatabaseService(dbPath);

      const audits = db.getRecentAudits(parseInt(options.limit, 10));

      if (audits.length === 0) {
        console.log(chalk.yellow('No audits found'));
        return;
      }

      const table = new Table({
        head: ['Program', 'Score', 'Risk', 'Date'],
        style: { head: ['cyan'] },
      });

      for (const audit of audits) {
        const scoreColor = audit.overallScore >= 70 ? chalk.green : audit.overallScore >= 50 ? chalk.yellow : chalk.red;
        table.push([
          audit.programId.slice(0, 20) + '...',
          scoreColor(`${audit.overallScore}/100`),
          getRiskLabel(audit.riskLevel),
          new Date(audit.timestamp).toLocaleDateString(),
        ]);
      }

      console.log(chalk.bold('\nRecent Audits:'));
      console.log(table.toString());

      db.close();
    } catch (error: any) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Stats command
program
  .command('stats')
  .description('Show auditor statistics')
  .action(async () => {
    try {
      const dbPath = process.env.DATABASE_PATH || './data/audits.db';
      const db = new DatabaseService(dbPath);

      const stats = db.getStats();

      console.log(chalk.bold('\nAuditor Statistics:'));
      console.log(`  ${chalk.gray('Total Audits:')} ${stats.totalAudits}`);
      console.log(`  ${chalk.gray('Unique Programs:')} ${stats.uniquePrograms}`);
      console.log(`  ${chalk.gray('Monitored Programs:')} ${stats.monitoredPrograms}`);
      console.log(`  ${chalk.gray('Critical Findings:')} ${chalk.red(stats.criticalFindings)}`);
      console.log(`  ${chalk.gray('Average Score:')} ${stats.averageScore}/100`);

      db.close();
    } catch (error: any) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// Helper functions
function getRiskLabel(risk: string): string {
  const labels: Record<string, string> = {
    SAFE: chalk.green.bold('SAFE'),
    LOW: chalk.blue.bold('LOW'),
    MEDIUM: chalk.yellow.bold('MEDIUM'),
    HIGH: chalk.red.bold('HIGH'),
    CRITICAL: chalk.bgRed.white.bold(' CRITICAL '),
  };
  return labels[risk] || risk;
}

function getSeverityColor(severity: string): (text: string) => string {
  const colors: Record<string, (text: string) => string> = {
    CRITICAL: chalk.red,
    HIGH: chalk.yellow,
    MEDIUM: chalk.magenta,
    LOW: chalk.blue,
    INFORMATIONAL: chalk.gray,
  };
  return colors[severity] || chalk.white;
}

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    PASSED: chalk.green('✓'),
    WARNING: chalk.yellow('⚠'),
    FAILED: chalk.red('✗'),
    SKIPPED: chalk.gray('○'),
    NOT_APPLICABLE: chalk.gray('-'),
  };
  return icons[status] || status;
}

program.parse();
