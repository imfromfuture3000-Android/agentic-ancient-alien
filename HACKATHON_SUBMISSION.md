# Agentic Ancient Alien — Colosseum Hackathon Submission

**Project:** Agentic Ancient Alien (AGENTIC ALIEN)  
**Team:** CryptonoutGene  
**Category:** DeFi / Autonomous Agents / Solana  
**Chain:** Solana (mainnet + devnet)

---

## Project Summary

Agentic Ancient Alien is a cyberpunk-themed autonomous DeFi empire builder on Solana. It combines a self-adapting AI agent (Ralph), real-time oracle intelligence for three pump.fun meme tokens, and a full-stack ad campaign engine — all running autonomously 24/7.

---

## Live Token Contracts (pump.fun)

| Token | Ticker | Contract Address |
|-------|--------|-----------------|
| NexusOracle | $NEXUS | `FSj2iWrjQWKRUfLJ8UKTwStW6Yz3njZW8mAL4sbxpump` |
| NexusPredict | $NXPD | `CwFLxN2Hq6rBwDZqtuUhBF59dCHj6y71XHM7o7dcpump` |
| OMNINEXUS | $OMNI | `7DMmJXxojXYeFAX53KQkZThRDRDGJ384YVN8zHWopump` |

---

## Core Skills / Features

### 1. RALPH AGENT BOT (Autonomous DeFi Loop)
- Infinite autonomous execution loop (15-second cycles)
- 5 self-adaptive strategies running concurrently:
  - **Cosmic Signal Seeker** — scans Solana slot signals for alpha
  - **Yield Harvester** — real-time treasury yield calculation via Helius RPC
  - **Arbitrage Hunter** — cross-DEX price spread detection
  - **Compound Engine** — auto-compounds accumulated earnings
  - **Liquidity Miner** — epoch-based LP reward harvesting
- Per-strategy toggle controls, success rate tracking, earnings per strategy
- Devnet / Mainnet switching mid-session
- Real-time logs streamed to UI (2-second poll interval)
- Multi-RPC health monitoring: Helius · Alchemy · Moralis

### 2. NEXUS EMPIRE PROMOTER (Automated Ad Campaigns)
- Live on-chain data for all 3 Nexus tokens via Helius mainnet DAS
- One-click AI ad generation (GPT-4o Mini) per token per platform
- Web search integration (DuckDuckGo Instant Answers) for trending crypto context
- Auto-generated ad copy for 4 platforms per token:
  - Twitter (280-char optimized)
  - Telegram (community-ready)
  - Discord (server-drop format)
  - Reddit (r/solana post format)
- One-click clipboard copy for every ad
- Template fallback system if AI unavailable

### 3. ALLOWLIST MANAGER
- Wallet address allowlist with 3 tiers: `whitelist` / `vip` / `team`
- Add/remove/check addresses in real-time
- REST API: `GET/POST/DELETE /api/allowlist`
- Integrated allowlist check: `GET /api/allowlist/:address`

### 4. WEB SEARCH SKILL
- Natural-language web search from the UI
- DuckDuckGo Instant Answer API integration (no key required)
- Results fed directly into AI ad copy generation pipeline
- REST API: `POST /api/search`

### 5. OMEGA PRIME DEPLOYER
- Alpenglow 150ms consensus simulation
- Firedancer 1M TPS optimization layer
- ZK compression with 1000x cost savings simulation
- Oneiro Hacker Security module
- RWA (Real World Asset) tokenization microstructures
- Emotional NFT minting (10 emotion types, ZK-compressed)

### 6. ZERO-COST RELAYER
- CAC-I belief-rewrite gasless transaction relay
- Fee subsidy optimization (95% reduction)
- ACE Capital microstructure fee routing
- Transaction cost estimation and comparison
- Full relay history stored in PostgreSQL

### 7. COSMIC BRIDGE (Wallet Integration)
- Phantom + Solflare wallet support via Solana Wallet Adapter
- Real SOL transfers to treasury on Solana devnet
- Transaction signature tracking + Solana Explorer links
- Interstellar Signal feed (all bridge events logged to DB)
- Devnet simulation mode for non-connected users

### 8. SOLANA RPC INTEGRATION
- Helius RPC (devnet + mainnet) as primary provider
- Alchemy Solana as backup RPC
- Moralis API for health checks
- Helius DAS (Digital Asset Standard) for token metadata

---

## Technical Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 · TypeScript · Vite · TailwindCSS · shadcn/ui |
| Animations | Framer Motion · custom glitch/scanline CSS |
| State | TanStack React Query (2-5s polling) |
| Routing | Wouter |
| Backend | Node.js · Express 5 · TypeScript |
| Database | PostgreSQL · Drizzle ORM |
| Solana | @solana/web3.js · wallet-adapter-react |
| AI | OpenAI GPT-4o Mini |
| Search | DuckDuckGo Instant Answers API |
| Blockchain Data | Helius RPC · Helius DAS · Alchemy · Moralis |

---

## API Surface

```
Solana
  GET  /api/solana/status           — network health
  GET  /api/solana/treasury         — treasury balance
  GET  /api/solana/balance/:address — wallet balance
  GET  /api/solana/transactions/:address

Ralph Agent
  GET  /api/agent/status            — live metrics, logs, strategies
  POST /api/agent/start             — start autonomous loop
  POST /api/agent/stop              — stop loop
  POST /api/agent/strategy/:id      — toggle strategy
  POST /api/agent/network           — switch devnet/mainnet

Nexus Tokens
  GET  /api/tokens                  — all 3 token info
  GET  /api/tokens/:id              — single token info
  POST /api/tokens/:id/campaign     — generate AI ad campaign
  GET  /api/tokens/:id/campaign     — fetch last campaign
  GET  /api/campaigns               — all campaigns

Web Search
  POST /api/search                  — DuckDuckGo web search

Allowlist
  GET    /api/allowlist             — list all entries
  POST   /api/allowlist             — add address + tier
  DELETE /api/allowlist/:address    — remove address
  GET    /api/allowlist/:address    — check if allowlisted

Omega Prime
  GET  /api/omega/status
  POST /api/omega/mint-nft
  GET  /api/omega/nfts
  GET  /api/omega/zk-compress

Zero-Cost Relayer
  POST /api/relayer/relay
  GET  /api/relayer/stats
  POST /api/relayer/estimate

Signals
  GET  /api/signals
  POST /api/signals
```

---

## Colosseum Copilot Integration

- Authenticated via Colosseum Copilot PAT (username: CryptonoutGene)
- Scope: `colosseum_copilot:read`
- Token valid through: 2026-06-25

---

## What Makes This Unique

1. **Fully autonomous** — Ralph Agent runs without human input, adapting strategy selection based on real network data
2. **Self-promoting** — the Nexus Promoter generates and refreshes ad content automatically using live web context + AI
3. **Empire-scale** — three coordinated pump.fun tokens ($NEXUS · $NXPD · $OMNI) backed by a unified autonomous agent
4. **Zero-cost philosophy** — relayer subsidizes gas, ZK compression reduces on-chain costs 1000x
5. **Secure by design** — all credentials stored as encrypted Replit secrets, never hardcoded
