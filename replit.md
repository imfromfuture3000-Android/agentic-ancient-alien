# Agentic Ancient Alien - Solana dApp

## Overview

A cyberpunk-themed Solana blockchain dashboard with Omega Prime Deployer features and Ralph Agent Bot for automated Empire building. The app includes wallet connectivity, ZK-compressed Token-2022 operations, emotional NFT minting, Zero-Cost Relayer with CAC-I belief rewrites, and an autonomous agent bot that runs infinite loops to seek signals, harvest yields, and compound earnings.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (Apr 2026)

- Added Nexus Empire Promoter — automated AI ad campaigns for $NEXUS, $NXPD, $OMNI
- Added Web Search skill — DuckDuckGo Instant Answers integrated into ad pipeline
- Added Allowlist Manager — whitelist/vip/team tier management with full REST API
- All API keys moved to encrypted Replit secrets (security hardening)
- Resolved package.json merge conflict

## Previous Changes (Feb 2026)

- Added Ralph Agent Bot - autonomous Empire building with 5 strategies
- Added Omega Prime Deployer - ZK compression, Alpenglow, Firedancer simulation
- Added Zero-Cost Relayer - gasless transactions with CAC-I rewrites
- Added Emotional NFT minting with 10 emotion types
- Multi-network support (devnet/mainnet switching)
- Real-time agent logs and earnings tracking

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled via Vite
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state with 2-5 second polling
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with cyberpunk theme (lime green primary, cyan secondary, dark navy background)
- **Fonts**: Orbitron (display) and Share Tech Mono (monospace) for sci-fi aesthetic
- **Animations**: Framer Motion for UI transitions and glitch effects
- **Tabs**: Cosmic Bridge, Omega Prime, Zero-Cost Relayer, Ralph Agent

### Solana Integration
- **Wallet Adapters**: @solana/wallet-adapter-react with Phantom and Solflare support
- **Connection**: Helius RPC for devnet/mainnet (with fallback)
- **Transactions**: SystemProgram transfers to treasury wallet with signature tracking
- **Network**: Switchable between devnet and mainnet

### Ralph Agent Bot
- **Location**: `server/ralph-agent.ts`
- **Features**: Autonomous infinite loop, 5 Empire building strategies
- **Strategies**: 
  - Cosmic Signal Seeker - detects network signals
  - Yield Harvester - simulates yield farming
  - Arbitrage Hunter - detects price spreads
  - Compound Engine - auto-compounds earnings
  - Liquidity Miner - LP reward simulation
- **APIs Used**: Helius, Alchemy, Moralis (all credentials stored in env)

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api/` prefix
- **Services**: omega-prime.ts, zero-cost-relayer.ts, ralph-agent.ts

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Tables**: alien_signals, emotional_nfts, relayer_transactions
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema sync

### API Structure
```
Signals
- GET  /api/signals - List recent alien signals
- POST /api/signals - Create new signal entry

Solana
- GET  /api/solana/status - Network connection status
- GET  /api/solana/treasury - Treasury wallet balance
- GET  /api/solana/balance/:address - Wallet balance lookup
- GET  /api/solana/transactions/:address - Recent transaction history

Omega Prime
- GET  /api/omega/status - Omega Prime status (Alpenglow, Firedancer, Security)
- POST /api/omega/mint-nft - Mint emotional NFT
- GET  /api/omega/nfts - List minted NFTs
- GET  /api/omega/zk-compress - ZK compression simulation

Zero-Cost Relayer
- POST /api/relayer/relay - Relay gasless transaction
- GET  /api/relayer/stats - Relayer statistics
- POST /api/relayer/estimate - Estimate relay cost

Ralph Agent Bot
- GET  /api/agent/status - Agent status, metrics, logs
- POST /api/agent/start - Start autonomous agent loop
- POST /api/agent/stop - Stop agent
- POST /api/agent/strategy/:id - Toggle strategy enable/disable
- POST /api/agent/network - Switch devnet/mainnet

Nexus Token Promoter
- GET  /api/tokens - All 3 Nexus token info (live on-chain)
- GET  /api/tokens/:id - Single token info
- POST /api/tokens/:id/campaign - Generate AI ad campaign
- GET  /api/tokens/:id/campaign - Fetch last campaign
- GET  /api/campaigns - All active campaigns

Web Search
- POST /api/search - DuckDuckGo instant web search

Allowlist
- GET    /api/allowlist - List all entries
- POST   /api/allowlist - Add address with tier (whitelist/vip/team)
- DELETE /api/allowlist/:address - Remove address
- GET    /api/allowlist/:address - Check if address is allowlisted
```

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components
      CyberCard.tsx
      GlitchText.tsx
      WalletButton.tsx
      OmegaPrimePanel.tsx
      ZeroCostRelayerPanel.tsx
      RalphAgentPanel.tsx
    components/ui/# shadcn/ui primitives
    hooks/        # Custom hooks (use-signals, use-toast)
    pages/        # Route components (Home.tsx)
    lib/          # Utilities (queryClient, utils)
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route definitions
  solana.ts       # Solana RPC interactions
  omega-prime.ts  # Omega Prime service
  zero-cost-relayer.ts # Zero-cost relayer service
  ralph-agent.ts  # Ralph Agent Bot
  storage.ts      # Database operations
  db.ts           # Drizzle connection
shared/           # Shared code
  schema.ts       # Database schema
  routes.ts       # API type definitions with Zod
```

## External Dependencies

### Blockchain Services
- **Helius RPC**: Premium Solana RPC (devnet + mainnet)
- **Alchemy**: Solana mainnet RPC backup
- **Moralis**: API endpoint health checks

### Database
- **PostgreSQL**: Primary data store (Neon-backed on Replit)

### Environment Variables (All Configured)
- `DATABASE_URL` - PostgreSQL connection string
- `HELIUS_API_KEY` - Helius RPC API key
- `HELIUS_HTTP_URL` - Helius mainnet URL
- `ALCHEMY_API_KEY` - Alchemy API key
- `HTTP_URL_SOL` - Alchemy Solana URL
- `MORALIS_API_KEY` - Moralis API key
- `SOLANA_TREASURY` - Treasury wallet address
- `VITE_HELIUS_RPC_URL` - Client-side Helius devnet URL
- `VITE_TREASURY_WALLET` - Client-side treasury address
- `VITE_REOWN_PROJECT_ID` - Reown (WalletConnect) project ID

### Key NPM Packages
- `@solana/web3.js` - Solana JavaScript SDK
- `@solana/wallet-adapter-*` - Wallet connection libraries
- `drizzle-orm` / `drizzle-kit` - Database ORM and migrations
- `@tanstack/react-query` - Async state management
- `framer-motion` - Animation library
- `date-fns` - Date formatting
- `zod` - Runtime type validation
