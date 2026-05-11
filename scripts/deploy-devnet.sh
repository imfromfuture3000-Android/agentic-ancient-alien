#!/bin/bash
# ============================================================
# Agentic Futarchy Markets — Full Devnet Deployment Script
# Single controller address for all operations
# ============================================================

set -e

echo "═══════════════════════════════════════════════════════"
echo "  AGENTIC FUTARCHY MARKETS — DEVNET DEPLOYMENT"
echo "═══════════════════════════════════════════════════════"
echo ""

CONTROLLER_KEYPAIR="${CONTROLLER_KEYPAIR:-$HOME/.config/solana/controller.json}"
NETWORK="devnet"
RPC_URL="${SOLANA_RPC_URL:-https://api.devnet.solana.com}"

# ─── Step 1: Check Prerequisites ───────────────────────────
echo "📋 Step 1: Checking prerequisites..."

command -v solana >/dev/null 2>&1 || { echo "❌ Solana CLI not found. Run: sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""; exit 1; }
command -v anchor >/dev/null 2>&1 || { echo "❌ Anchor CLI not found. Run: cargo install --git https://github.com/coral-xyz/anchor anchor-cli"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Install from https://nodejs.org"; exit 1; }

echo "  ✅ Solana CLI: $(solana --version)"
echo "  ✅ Anchor CLI: $(anchor --version)"
echo "  ✅ Node.js:    $(node --version)"
echo ""

# ─── Step 2: Configure Solana ──────────────────────────────
echo "📋 Step 2: Configuring Solana for $NETWORK..."

solana config set --url $RPC_URL --quiet
solana config set --keypair $CONTROLLER_KEYPAIR --quiet 2>/dev/null || true

# ─── Step 3: Generate or Load Controller ───────────────────
echo "📋 Step 3: Setting up controller keypair..."

if [ ! -f "$CONTROLLER_KEYPAIR" ]; then
  echo "  🔑 Generating new controller keypair..."
  solana-keygen new -o "$CONTROLLER_KEYPAIR" --no-bip39-passphrase --force
  echo "  ⚠️  SAVE THIS KEYPAIR SECURELY!"
else
  echo "  ✅ Using existing controller keypair"
fi

CONTROLLER_ADDRESS=$(solana-keygen pubkey "$CONTROLLER_KEYPAIR")
echo "  🔑 Controller Address: $CONTROLLER_ADDRESS"
echo ""

# ─── Step 4: Fund Controller ──────────────────────────────
echo "📋 Step 4: Funding controller..."

BALANCE=$(solana balance "$CONTROLLER_ADDRESS" --url $RPC_URL 2>/dev/null | awk '{print $1}')
echo "  Current balance: ${BALANCE:-0} SOL"

if (( $(echo "${BALANCE:-0} < 2" | bc -l) )); then
  echo "  💰 Requesting airdrop (2 SOL)..."
  solana airdrop 2 "$CONTROLLER_ADDRESS" --url $RPC_URL || {
    echo "  ⚠️  Airdrop failed. Try again or fund manually."
  }
  sleep 2
  BALANCE=$(solana balance "$CONTROLLER_ADDRESS" --url $RPC_URL 2>/dev/null | awk '{print $1}')
  echo "  Updated balance: ${BALANCE:-0} SOL"
fi
echo ""

# ─── Step 5: Install Dependencies ─────────────────────────
echo "📋 Step 5: Installing dependencies..."
npm install --silent 2>/dev/null || npm install
echo "  ✅ Dependencies installed"
echo ""

# ─── Step 6: Build Program ────────────────────────────────
echo "📋 Step 6: Building Anchor program..."
anchor build
echo "  ✅ Program built successfully"

# Get program ID from build
PROGRAM_ID=$(solana-keygen pubkey target/deploy/agentic_futarchy-keypair.json 2>/dev/null || echo "")
if [ -n "$PROGRAM_ID" ]; then
  echo "  📋 Program ID: $PROGRAM_ID"
  
  # Update program ID in source
  sed -i "s/declare_id!(\".*\")/declare_id!(\"$PROGRAM_ID\")/" programs/agentic_futarchy/src/lib.rs
  sed -i "s/agentic_futarchy = \".*\"/agentic_futarchy = \"$PROGRAM_ID\"/" Anchor.toml
  
  echo "  ✅ Program ID updated in source files"
  echo "  🔄 Rebuilding with correct program ID..."
  anchor build
fi
echo ""

# ─── Step 7: Deploy ──────────────────────────────────────
echo "📋 Step 7: Deploying to $NETWORK..."
anchor deploy --provider.cluster $NETWORK --provider.wallet "$CONTROLLER_KEYPAIR"

PROGRAM_ID=$(solana-keygen pubkey target/deploy/agentic_futarchy-keypair.json)
echo "  ✅ Program deployed!"
echo "  📋 Program ID: $PROGRAM_ID"
echo ""

# ─── Step 8: Initialize Protocol ─────────────────────────
echo "📋 Step 8: Initializing protocol with controller..."
PROGRAM_ID=$PROGRAM_ID CONTROLLER_KEYPAIR=$CONTROLLER_KEYPAIR npx ts-node scripts/controller/initialize.ts || {
  echo "  ⚠️  Initialization may have already been done."
}
echo ""

# ─── Step 9: Verify Deployment ───────────────────────────
echo "📋 Step 9: Verifying deployment..."
PROGRAM_ID=$PROGRAM_ID npx ts-node scripts/controller/check-authority.ts || true
echo ""

# ─── Step 10: Run PDA Mapper ─────────────────────────────
echo "📋 Step 10: Mapping PDAs..."
npx ts-node scripts/pda-mapper.ts "$PROGRAM_ID" || true
echo ""

# ─── Summary ─────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ DEPLOYMENT COMPLETE"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  Network:         $NETWORK"
echo "  Program ID:      $PROGRAM_ID"
echo "  Controller:      $CONTROLLER_ADDRESS"
echo "  RPC URL:         $RPC_URL"
echo ""
echo "  Explorer Links:"
echo "  Program:    https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo "  Controller: https://explorer.solana.com/address/$CONTROLLER_ADDRESS?cluster=devnet"
echo ""
echo "  Next Steps:"
echo "  1. Create your first market:"
echo "     npx ts-node scripts/controller/create-market.ts --name \"Test Market\""
echo "  2. Set GitHub Secrets for automation"
echo "  3. Enable GitHub Actions workflows"
echo ""
echo "═══════════════════════════════════════════════════════"

# Save deployment info
cat > deployment-info.json <<EOF
{
  "network": "$NETWORK",
  "programId": "$PROGRAM_ID",
  "controllerAddress": "$CONTROLLER_ADDRESS",
  "rpcUrl": "$RPC_URL",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "explorerLinks": {
    "program": "https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet",
    "controller": "https://explorer.solana.com/address/$CONTROLLER_ADDRESS?cluster=devnet"
  }
}
EOF

echo "📄 Deployment info saved to deployment-info.json"
