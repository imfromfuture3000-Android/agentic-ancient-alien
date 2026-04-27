#!/bin/bash

# Agentic Futarchy Markets - Bootstrap Script
set -e

echo "🚀 Starting Agentic Futarchy Markets Bootstrap..."

# 1. Check Prerequisites
echo "🔍 Checking prerequisites..."

check_cmd() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed."
        return 1
    fi
    return 0
}

# Install Rust if not present
if ! check_cmd rustc; then
    echo "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
fi

# Install Solana CLI if not present
if ! check_cmd solana; then
    echo "Installing Solana CLI..."
    sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
fi

# Install Anchor CLI if not present
if ! check_cmd anchor; then
    echo "Installing Anchor CLI..."
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install latest
    avm use latest
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# 2. Configure Solana Devnet Wallet
echo "💳 Configuring Solana devnet wallet..."
if [ ! -f "$HOME/.config/solana/id.json" ]; then
    echo "Generating new devnet keypair..."
    solana-keygen new --no-passphrase
fi

solana config set --url devnet

# Airdrop SOL
echo "🪂 Requesting airdrop on devnet..."
solana airdrop 2 || echo "⚠️ Airdrop failed, might be rate limited. Continuing..."

# 3. Build Smart Contracts
echo "🏗️ Building Anchor programs..."
anchor build

# 4. Run Initial Scans
echo "🕵️ Running initial scans..."
chmod +x scripts/run-all-scanners.sh
./scripts/run-all-scanners.sh

echo "✅ Bootstrap complete! Your environment is ready."
echo "Summary:"
echo "- Rust, Solana, Anchor, Node.js: OK"
echo "- Devnet Wallet: $(solana address)"
echo "- Contracts: Built"
echo "- Initial Scans: Completed"
