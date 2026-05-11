# Deployment Guide — Agentic Futarchy Markets

## Network: Solana Devnet

### Quick Deploy

```bash
# 1. Generate controller keypair (ONE address controls everything)
solana-keygen new -o ~/.config/solana/controller.json
solana config set --url devnet
solana config set --keypair ~/.config/solana/controller.json

# 2. Fund the controller
solana airdrop 5

# 3. Build and deploy
anchor build
anchor deploy --provider.cluster devnet

# 4. Update program ID in lib.rs and Anchor.toml with the deployed ID
# Then rebuild and redeploy:
anchor build
anchor deploy --provider.cluster devnet

# 5. Initialize the protocol
npx ts-node scripts/controller/initialize.ts
```

---

## Architecture: Single Controller Authority

All admin operations flow through ONE controller address. This address has full authority over:

| Operation | Command |
|-----------|---------|
| Initialize protocol | `npx ts-node scripts/controller/initialize.ts` |
| Create market | `npx ts-node scripts/controller/create-market.ts --name "..." --deadline <unix_ts>` |
| Resolve market | `npx ts-node scripts/controller/resolve-market.ts --market-id 0 --outcome 0` |
| Transfer authority | `npx ts-node scripts/controller/transfer-authority.ts --new-controller <PUBKEY>` |
| Check status | `npx ts-node scripts/controller/check-authority.ts` |

---

## PDA Address Map

All accounts are derived deterministically from the program ID:

| Account | Seeds | Description |
|---------|-------|-------------|
| Protocol State | `["protocol_state"]` | Global state, stores controller address |
| Market N | `["market", market_id_le_bytes]` | Individual market account |
| Market Vault N | `["market_token_account", market_pubkey]` | Token vault for market N |
| User Bet | `["user_bet", market_pubkey, bettor_pubkey]` | Individual bet record |

### Deriving PDAs Programmatically

```typescript
import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID");

// Protocol State
const [protocolState] = PublicKey.findProgramAddressSync(
  [Buffer.from("protocol_state")],
  PROGRAM_ID
);

// Market (by ID)
const marketId = 0;
const [market] = PublicKey.findProgramAddressSync(
  [Buffer.from("market"), Buffer.from(new BN(marketId).toArray("le", 8))],
  PROGRAM_ID
);

// User Bet
const [bet] = PublicKey.findProgramAddressSync(
  [Buffer.from("user_bet"), marketPubkey.toBuffer(), bettorPubkey.toBuffer()],
  PROGRAM_ID
);
```

---

## Controller Security

### Best Practices

1. **Never share the controller keypair file** (`controller.json`)
2. **Add to .gitignore**: `*.json` keypair files are already excluded
3. **Use hardware wallet** for mainnet deployment
4. **Transfer authority** to a multisig for production

### Emergency Procedures

- **Pause protocol**: The controller can pause all market creation instantly
- **Transfer authority**: If compromised, immediately transfer to a new address
- **Key rotation**: Generate new keypair → transfer authority → destroy old key

---

## GitHub Actions Integration

The automated workflows use GitHub Secrets for the controller:

| Secret | Description |
|--------|-------------|
| `SOLANA_PRIVATE_KEY` | Base58 encoded controller private key |
| `SOLANA_RPC_URL` | Devnet/Mainnet RPC endpoint |
| `PROGRAM_ID` | Deployed program address |
| `OPENAI_API_KEY` | For AI agent research features |
| `COLOSSEUM_COPILOT_PAT` | Colosseum research API token |

### Setting Secrets

```bash
# Via GitHub CLI
gh secret set SOLANA_PRIVATE_KEY --body "$(cat ~/.config/solana/controller.json)"
gh secret set SOLANA_RPC_URL --body "https://api.devnet.solana.com"
gh secret set PROGRAM_ID --body "YOUR_DEPLOYED_PROGRAM_ID"
```

---

## Deployment Checklist

- [ ] Generate controller keypair
- [ ] Fund controller with SOL (devnet airdrop or transfer)
- [ ] Build Anchor program (`anchor build`)
- [ ] Deploy to devnet (`anchor deploy`)
- [ ] Update program ID in `lib.rs` and `Anchor.toml`
- [ ] Rebuild and redeploy with correct ID
- [ ] Initialize protocol (`scripts/controller/initialize.ts`)
- [ ] Verify authority (`scripts/controller/check-authority.ts`)
- [ ] Create first test market
- [ ] Set GitHub Secrets for automation
- [ ] Enable GitHub Actions workflows
- [ ] Run full scanner suite (`make scan`)

---

## Explorer Links

After deployment, view your program at:
- **Program**: `https://explorer.solana.com/address/YOUR_PROGRAM_ID?cluster=devnet`
- **Controller**: `https://explorer.solana.com/address/YOUR_CONTROLLER_ADDRESS?cluster=devnet`
- **Protocol PDA**: `https://explorer.solana.com/address/YOUR_PROTOCOL_PDA?cluster=devnet`
