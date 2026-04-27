# Automation Setup Guide

This document details the fully automated ecosystem for the **Agentic Futarchy Markets** project.

## 1. One-Command Bootstrap
The project includes a comprehensive bootstrap script to set up the entire development environment from scratch.

**Command:**
```bash
make setup
# OR
./scripts/setup.sh
```

**What it does:**
- Checks for and installs **Rust**, **Solana CLI**, **Anchor CLI**, and **Node.js**.
- Installs all project dependencies via `npm`.
- Configures a local Solana devnet wallet (generates one if missing).
- Requests a SOL airdrop on devnet.
- Builds all Anchor smart contracts.
- Runs the initial suite of scanners and agents.

---

## 2. GitHub Actions Automation Matrix
The project leverages four primary workflows to maintain an autonomous cycle:

| Workflow | Frequency | Purpose |
| :--- | :--- | :--- |
| **CI (Standard)** | Every Push/PR | Ensures code quality, runs tests, and builds contracts. |
| **Agent Loop** | Every 6 Hours | Self-learning loop: scans trends, analyzes on-chain data, and auto-commits findings to `agent-reports/`. |
| **Contract Scanner** | Daily | Discovers new programs, audits multisig patterns, and maps PDAs. Results in `scan-reports/`. |
| **Security Audit** | Weekly | Scans for vulnerabilities, exposed secrets, and dependency issues. |

---

## 3. Data Pipeline Architecture
The flow of information in this project is designed for autonomous decision-making:

1.  **Ingestion**: `scripts/scan-programs.ts` and `scripts/pda-mapper.ts` pull raw on-chain data from Solana.
2.  **Processing**: Data is stored in `scan-reports/` as structured JSON/logs.
3.  **Analysis**: `scripts/agent-researcher.ts` (the Agent Researcher) reads the scan reports and external trends.
4.  **Synthesis**: Findings are logged in `agent-reports/` and used to suggest new market creations.
5.  **Execution**: Validated suggestions can be deployed as new markets via the smart contract.

---

## 4. GitHub Secrets Required
To enable the full GitHub Actions suite, the following secrets must be configured in the repository settings:

- `SOLANA_PRIVATE_KEY`: The base58-encoded private key for the deployment/agent wallet.
- `SOLANA_RPC_URL`: A reliable RPC endpoint (e.g., Helius, Alchemy, or QuickNode).
- `OPENAI_API_KEY`: Required for the `agent-researcher.ts` to process trends.
- `COLOSSEUM_COPILOT_PAT`: Personal Access Token for GitHub automation and cross-repo interactions.

---

## 5. Monitoring & Alerts
- **Logs**: Check the `Actions` tab in GitHub to view real-time execution of loops.
- **Reports**: Monitor the `agent-reports/` and `scan-reports/` directories for automated commits.
- **On-Chain**: Use a Solana explorer to track the activity of the program IDs listed in the scan reports.
