#!/bin/bash

# Agentic Futarchy Markets - Devnet Deployment Script
set -e

echo "🚀 Deploying to Solana Devnet..."

# 1. Build
echo "🏗️ Building Anchor program..."
anchor build

# 2. Deploy
echo "🚢 Deploying..."
DEPLOY_OUTPUT=$(anchor deploy --provider.cluster devnet)
echo "$DEPLOY_OUTPUT"

# 3. Extract Program ID
PROGRAM_ID=$(echo "$DEPLOY_OUTPUT" | grep "Program Id:" | awk '{print $3}')

if [ -n "$PROGRAM_ID" ]; then
    echo "✅ Successfully deployed program: $PROGRAM_ID"
    
    # 4. Run PDA mapper on new deployment
    echo "🗺️ Mapping PDAs for new deployment..."
    npx ts-node scripts/pda-mapper.ts "$PROGRAM_ID"
else
    echo "❌ Deployment failed or Program ID not found in output."
    exit 1
fi

echo "📊 Deployment Summary:"
echo "- Cluster: Devnet"
echo "- Program ID: $PROGRAM_ID"
echo "- Timestamp: $(date)"
