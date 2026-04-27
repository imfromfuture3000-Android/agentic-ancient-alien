#!/bin/bash

# Agentic Futarchy Markets - Scanner Execution Script
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCAN_LOG="scan-reports/scan_$TIMESTAMP.log"
AGENT_LOG="agent-reports/agent_$TIMESTAMP.log"

echo "🔍 Starting full scanner suite at $TIMESTAMP..."

# Ensure directories exist
mkdir -p scan-reports agent-reports

# 1. Scan Programs
echo "📡 Running scan-programs.ts..."
npx ts-node scripts/scan-programs.ts >> "$SCAN_LOG" 2>&1

# 2. Multisig Checker
echo "🔐 Running multisig-checker.ts..."
npx ts-node scripts/multisig-checker.ts >> "$SCAN_LOG" 2>&1

# 3. PDA Mapper
echo "🗺️ Running pda-mapper.ts..."
npx ts-node scripts/pda-mapper.ts >> "$SCAN_LOG" 2>&1

# 4. Agent Researcher
echo "🤖 Running agent-researcher.ts..."
npx ts-node scripts/agent-researcher.ts >> "$AGENT_LOG" 2>&1

echo "✅ All scanners executed."
echo "Results saved to:"
echo "- $SCAN_LOG"
echo "- $AGENT_LOG"
