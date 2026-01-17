# Solana Smart Contract Auditor

An autonomous agent for continuous Solana smart contract security auditing with bytecode analysis, vulnerability detection, and automated reporting.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Solana](https://img.shields.io/badge/Solana-9945FF?style=flat&logo=solana&logoColor=white)
![Security](https://img.shields.io/badge/Security-Audit-green?style=flat)

## Features

- **Bytecode Analysis**: Deep inspection of BPF bytecode for vulnerability patterns
- **Vulnerability Detection**: 10+ known vulnerability patterns from Sealevel attacks
- **Security Checks**: Automated checks for common security issues
- **Continuous Monitoring**: Watch programs for upgrades and changes
- **Automated Reports**: Generate JSON/Markdown audit reports
- **REST API**: Full API for integration with other tools
- **CLI Tool**: Command-line interface for quick audits

## Vulnerabilities Detected

| ID | Name | Severity | Category |
|----|------|----------|----------|
| UPGRADE_AUTHORITY | Upgrade Authority Not Revoked | HIGH | Configuration |
| MISSING_SIGNER | Missing Signer Verification | CRITICAL | Access Control |
| MISSING_OWNER | Missing Owner Verification | CRITICAL | Access Control |
| INTEGER_OVERFLOW | Potential Integer Overflow | HIGH | Arithmetic |
| ARBITRARY_CPI | Unchecked Cross-Program Invocation | CRITICAL | External Calls |
| DUPLICATE_ACCOUNTS | Duplicate Mutable Accounts | HIGH | Account Validation |
| UNSAFE_PDA | Unsafe PDA Derivation | HIGH | PDA Validation |
| UNINITIALIZED | Uninitialized Account Access | HIGH | Initialization |

## Quick Start

### Installation

```bash
git clone https://github.com/pranay123-stack/solana-smart-contract-auditor.git
cd solana-smart-contract-auditor

npm install
cp .env.example .env
npm run build
```

### Run Audit (CLI)

```bash
# Full audit
npm run audit -- audit <PROGRAM_ID>

# Quick check
npm run audit -- quick <PROGRAM_ID>

# List recent audits
npm run audit -- list

# View stats
npm run audit -- stats
```

### Run API Server

```bash
npm start
# Server runs at http://localhost:3002
```

## API Endpoints

### Audit Endpoints

```bash
# Full security audit
POST /api/audit
{
  "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "programName": "Token Program"
}

# Quick security check
GET /api/audit/:programId/quick

# Get audit result
GET /api/audit/:programId
```

### Monitoring Endpoints

```bash
# Add program to monitoring
POST /api/monitor
{
  "programId": "...",
  "name": "My Program",
  "alertOnUpgrade": true,
  "webhookUrl": "https://discord.com/webhook/..."
}

# List monitored programs
GET /api/monitor

# Remove from monitoring
DELETE /api/monitor/:programId
```

### Report Endpoints

```bash
# Generate report
POST /api/reports/:programId
{
  "format": "markdown"
}

# List recent audits
GET /api/audits
```

## Example Response

```json
{
  "success": true,
  "data": {
    "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "programName": "Token Program",
    "overallScore": 85,
    "riskLevel": "LOW",
    "summary": {
      "criticalIssues": 0,
      "highIssues": 1,
      "mediumIssues": 2,
      "lowIssues": 1
    },
    "vulnerabilities": [
      {
        "name": "Upgrade Authority Not Revoked",
        "severity": "HIGH",
        "category": "UPGRADE_RISK",
        "description": "Program is upgradeable...",
        "recommendation": "Consider revoking upgrade authority..."
      }
    ],
    "securityChecks": [
      {
        "name": "Signer Verification",
        "status": "PASSED",
        "description": "Signer verification patterns detected"
      }
    ],
    "recommendations": [
      "Review 1 high-severity issue before mainnet deployment"
    ]
  }
}
```

## CLI Usage

```bash
# Run full audit with report
npx ts-node src/cli.ts audit <PROGRAM_ID> --name "My Program" --format markdown

# Quick check
npx ts-node src/cli.ts quick <PROGRAM_ID>

# List audits
npx ts-node src/cli.ts list --limit 20

# Show statistics
npx ts-node src/cli.ts stats
```

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `SOLANA_RPC_URL` | mainnet-beta | Solana RPC endpoint |
| `PORT` | 3002 | API server port |
| `DATABASE_PATH` | ./data/audits.db | SQLite database path |
| `REPORTS_DIR` | ./reports | Report output directory |
| `ENABLE_CONTINUOUS_MONITORING` | true | Enable upgrade monitoring |
| `MONITOR_INTERVAL_MS` | 60000 | Monitoring check interval |

## Architecture

```
src/
├── index.ts              # Main entry point
├── cli.ts                # CLI tool
├── api/
│   └── server.ts         # REST API
├── services/
│   ├── auditor.ts        # Main audit orchestrator
│   └── programFetcher.ts # Solana data fetching
├── analyzers/
│   └── bytecodeAnalyzer.ts # BPF bytecode analysis
├── detectors/
│   └── vulnerabilityDetector.ts # Vulnerability patterns
├── reporters/
│   └── reportGenerator.ts # Report generation
├── monitoring/
│   └── monitor.ts        # Upgrade monitoring
├── db/
│   └── database.ts       # SQLite persistence
└── types/
    └── index.ts          # TypeScript interfaces
```

## Testing

```bash
npm test
npm test -- --coverage
```

## Risk Levels

| Level | Score | Description |
|-------|-------|-------------|
| SAFE | 90-100 | No significant issues found |
| LOW | 70-89 | Minor issues, generally safe |
| MEDIUM | 50-69 | Some concerns, review recommended |
| HIGH | 30-49 | Significant issues, proceed with caution |
| CRITICAL | 0-29 | Severe vulnerabilities, do not use |

## References

- [Sealevel Attacks](https://github.com/coral-xyz/sealevel-attacks)
- [Solana Security Best Practices](https://docs.solana.com/developing/programming-model/overview)
- [Anchor Security](https://www.anchor-lang.com/docs/security)

## License

MIT License

## Disclaimer

This tool provides automated security analysis and should not be considered a complete security audit. Always combine automated tools with manual code review. The authors are not responsible for any security issues or financial losses.
