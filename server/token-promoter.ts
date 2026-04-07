import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// The 3 Nexus token contracts on pump.fun
export const NEXUS_TOKENS = [
  {
    id: "nexus",
    name: "NexusOracle",
    ticker: "$NEXUS",
    address: "FSj2iWrjQWKRUfLJ8UKTwStW6Yz3njZW8mAL4sbxpump",
    pumpUrl: "https://pump.fun/coin/FSj2iWrjQWKRUfLJ8UKTwStW6Yz3njZW8mAL4sbxpump",
    description: "The oracle that sees all chains. Predictive intelligence on Solana.",
    color: "#00ff88",
  },
  {
    id: "nxpd",
    name: "NexusPredict",
    ticker: "$NXPD",
    address: "CwFLxN2Hq6rBwDZqtuUhBF59dCHj6y71XHM7o7dcpump",
    pumpUrl: "https://pump.fun/coin/CwFLxN2Hq6rBwDZqtuUhBF59dCHj6y71XHM7o7dcpump",
    description: "Next-gen prediction markets powered by decentralized AI.",
    color: "#00ccff",
  },
  {
    id: "omni",
    name: "OMNINEXUS",
    ticker: "$OMNI",
    address: "7DMmJXxojXYeFAX53KQkZThRDRDGJ384YVN8zHWopump",
    pumpUrl: "https://pump.fun/coin/7DMmJXxojXYeFAX53KQkZThRDRDGJ384YVN8zHWopump",
    description: "The omnichain nexus. One token to rule all networks.",
    color: "#aa44ff",
  },
];

interface TokenInfo {
  id: string;
  name: string;
  ticker: string;
  address: string;
  pumpUrl: string;
  description: string;
  color: string;
  solBalance: number;
  holderCount: number | null;
  recentTxCount: number;
  lastActivity: number | null;
  marketCap: string;
}

interface AdCampaign {
  tokenId: string;
  ads: AdPost[];
  generatedAt: number;
  searchContext: string;
}

interface AdPost {
  platform: "twitter" | "telegram" | "discord" | "reddit";
  headline: string;
  body: string;
  hashtags: string[];
  callToAction: string;
}

interface SearchResult {
  query: string;
  results: string;
  timestamp: number;
}

const mainnetConnection = new Connection(
  `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
  "confirmed"
);

// --- Token Data Fetcher ---
export async function fetchTokenInfo(token: typeof NEXUS_TOKENS[0]): Promise<TokenInfo> {
  let solBalance = 0;
  let recentTxCount = 0;
  let lastActivity: number | null = null;

  try {
    const pubkey = new PublicKey(token.address);
    const balance = await mainnetConnection.getBalance(pubkey);
    solBalance = balance / LAMPORTS_PER_SOL;

    const sigs = await mainnetConnection.getSignaturesForAddress(pubkey, { limit: 10 });
    recentTxCount = sigs.length;
    lastActivity = sigs[0]?.blockTime ? sigs[0].blockTime * 1000 : null;
  } catch {
    // RPC failure – fall back to zeros
  }

  // Fetch pump.fun bonding curve data via Helius DAS
  let holderCount: number | null = null;
  let marketCap = "N/A";
  try {
    const resp = await fetch(
      `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "nexus",
          method: "getAsset",
          params: { id: token.address },
        }),
      }
    );
    if (resp.ok) {
      const data = await resp.json();
      if (data.result?.token_info) {
        const supply = data.result.token_info.supply;
        const price = data.result.token_info.price_info?.price_per_token;
        if (supply && price) {
          const mc = (supply / 1e6) * price;
          marketCap = mc > 1_000_000
            ? `$${(mc / 1_000_000).toFixed(2)}M`
            : mc > 1_000
            ? `$${(mc / 1_000).toFixed(2)}K`
            : `$${mc.toFixed(2)}`;
        }
      }
    }
  } catch {
    // ignore
  }

  return {
    ...token,
    solBalance,
    holderCount,
    recentTxCount,
    lastActivity,
    marketCap,
  };
}

export async function fetchAllTokenInfo(): Promise<TokenInfo[]> {
  const results = await Promise.allSettled(NEXUS_TOKENS.map(fetchTokenInfo));
  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : { ...NEXUS_TOKENS[i], solBalance: 0, holderCount: null, recentTxCount: 0, lastActivity: null, marketCap: "N/A" }
  );
}

// --- Web Search (DuckDuckGo Instant Answer API) ---
export async function webSearch(query: string): Promise<SearchResult> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const resp = await fetch(url, { headers: { "User-Agent": "NexusAgentBot/1.0" } });
    if (!resp.ok) throw new Error("DDG search failed");
    const data = await resp.json();
    const abstract = data.AbstractText || data.Answer || data.RelatedTopics?.[0]?.Text || "No results found.";
    return { query, results: abstract, timestamp: Date.now() };
  } catch (err) {
    return { query, results: `Search unavailable: ${String(err)}`, timestamp: Date.now() };
  }
}

// --- AI Ad Generator (OpenAI) ---
const AD_TEMPLATES: Record<string, AdPost[]> = {
  nexus: [
    {
      platform: "twitter",
      headline: "🔮 NexusOracle ($NEXUS) sees what others can't",
      body: "The on-chain oracle of the future is HERE. $NEXUS aggregates multi-chain signals, predicts market moves, and rewards holders with divine alpha. Don't sleep on this.",
      hashtags: ["#NEXUS", "#Solana", "#PumpFun", "#DeFi", "#Crypto", "#AI"],
      callToAction: "Buy on pump.fun → FSj2iWrjQWKRUfLJ8UKTwStW6Yz3njZW8mAL4sbxpump",
    },
    {
      platform: "telegram",
      headline: "🚀 $NEXUS - NexusOracle | The Alpha Machine",
      body: "NexusOracle ($NEXUS) is the predictive intelligence layer for the entire Solana ecosystem. Real-time oracle feeds. Autonomous signal generation. Backed by the OMNI empire.\n\n📍 Contract: FSj2iWrjQWKRUfLJ8UKTwStW6Yz3njZW8mAL4sbxpump",
      hashtags: ["#NEXUS", "#NexusOracle", "#Solana"],
      callToAction: "🔥 Ape in now on pump.fun",
    },
    {
      platform: "discord",
      headline: "Alpha Drop: $NEXUS is live",
      body: "NexusOracle just went live on pump.fun. The oracle protocol that connects all Solana DeFi signals into one unified intelligence feed. Community-driven, LP-locked, team doxxed.\n\nContract: `FSj2iWrjQWKRUfLJ8UKTwStW6Yz3njZW8mAL4sbxpump`",
      hashtags: ["NEXUS", "NexusOracle"],
      callToAction: "https://pump.fun/coin/FSj2iWrjQWKRUfLJ8UKTwStW6Yz3njZW8mAL4sbxpump",
    },
    {
      platform: "reddit",
      headline: "[Solana] NexusOracle ($NEXUS) – on-chain predictive intelligence now live on pump.fun",
      body: "Hey r/solana — NexusOracle ($NEXUS) just launched on pump.fun. It's an autonomous oracle system that aggregates on-chain signals across Solana DeFi protocols and generates actionable alpha for holders.\n\nContract address: FSj2iWrjQWKRUfLJ8UKTwStW6Yz3njZW8mAL4sbxpump\n\nDYOR. Not financial advice.",
      hashtags: ["#Solana", "#DeFi", "#crypto"],
      callToAction: "pump.fun/coin/FSj2iWrjQWKRUfLJ8UKTwStW6Yz3njZW8mAL4sbxpump",
    },
  ],
  nxpd: [
    {
      platform: "twitter",
      headline: "🎯 $NXPD – NexusPredict: bet on the future of DeFi",
      body: "Decentralized prediction markets just got a brain upgrade. $NXPD powers on-chain forecasting with AI-backed signal intelligence. Early holders = early winners.",
      hashtags: ["#NXPD", "#NexusPredict", "#Solana", "#PumpFun", "#PredictionMarkets"],
      callToAction: "Buy now → CwFLxN2Hq6rBwDZqtuUhBF59dCHj6y71XHM7o7dcpump",
    },
    {
      platform: "telegram",
      headline: "🔥 $NXPD - NexusPredict | Predict. Win. Repeat.",
      body: "NexusPredict ($NXPD) is the AI-powered prediction layer of the Nexus ecosystem. Stake $NXPD to access exclusive market signals, forecast rewards, and empire-building alpha.\n\n📍 Contract: CwFLxN2Hq6rBwDZqtuUhBF59dCHj6y71XHM7o7dcpump",
      hashtags: ["#NXPD", "#NexusPredict", "#Solana"],
      callToAction: "🎰 Join the prediction empire now on pump.fun",
    },
    {
      platform: "discord",
      headline: "New gem alert: $NXPD NexusPredict",
      body: "NexusPredict ($NXPD) just launched. The prediction market protocol tied to the full Nexus oracle empire. Holders get early access to signal feeds and compound rewards.\n\nContract: `CwFLxN2Hq6rBwDZqtuUhBF59dCHj6y71XHM7o7dcpump`",
      hashtags: ["NXPD", "NexusPredict"],
      callToAction: "https://pump.fun/coin/CwFLxN2Hq6rBwDZqtuUhBF59dCHj6y71XHM7o7dcpump",
    },
    {
      platform: "reddit",
      headline: "[Solana] NexusPredict ($NXPD) – AI prediction markets live on pump.fun",
      body: "NexusPredict ($NXPD) is the prediction market arm of the Nexus ecosystem on Solana. Uses AI-aggregated oracle data to power decentralized forecasting.\n\nContract: CwFLxN2Hq6rBwDZqtuUhBF59dCHj6y71XHM7o7dcpump\n\nNot financial advice. DYOR.",
      hashtags: ["#Solana", "#PredictionMarkets", "#DeFi"],
      callToAction: "pump.fun/coin/CwFLxN2Hq6rBwDZqtuUhBF59dCHj6y71XHM7o7dcpump",
    },
  ],
  omni: [
    {
      platform: "twitter",
      headline: "🌐 $OMNI – OMNINEXUS: one token for ALL chains",
      body: "$OMNI is the master key to the entire Nexus empire. Bridge protocols, oracle feeds, prediction markets – all unified under one omnichain token. The empire expands.",
      hashtags: ["#OMNI", "#OMNINEXUS", "#Solana", "#PumpFun", "#Omnichain", "#DeFi"],
      callToAction: "Buy $OMNI → 7DMmJXxojXYeFAX53KQkZThRDRDGJ384YVN8zHWopump",
    },
    {
      platform: "telegram",
      headline: "⚡ $OMNI - OMNINEXUS | The Empire Token",
      body: "OMNINEXUS ($OMNI) is the apex of the Nexus ecosystem. The omnichain token that connects $NEXUS oracle feeds, $NXPD predictions, and the full DeFi empire into one sovereign asset.\n\n📍 Contract: 7DMmJXxojXYeFAX53KQkZThRDRDGJ384YVN8zHWopump",
      hashtags: ["#OMNI", "#OMNINEXUS", "#Solana"],
      callToAction: "👑 The empire token. Buy on pump.fun now.",
    },
    {
      platform: "discord",
      headline: "OMNINEXUS ($OMNI) – the final piece of the empire",
      body: "OMNINEXUS ($OMNI) ties together the entire Nexus ecosystem. Holding $OMNI gives you exposure to the combined utility of NexusOracle + NexusPredict + the full omnichain bridge layer.\n\nContract: `7DMmJXxojXYeFAX53KQkZThRDRDGJ384YVN8zHWopump`",
      hashtags: ["OMNI", "OMNINEXUS"],
      callToAction: "https://pump.fun/coin/7DMmJXxojXYeFAX53KQkZThRDRDGJ384YVN8zHWopump",
    },
    {
      platform: "reddit",
      headline: "[Solana] OMNINEXUS ($OMNI) – the omnichain empire token just launched on pump.fun",
      body: "OMNINEXUS ($OMNI) is live on pump.fun. It's the central token of the Nexus DeFi empire on Solana, combining oracle intelligence ($NEXUS), AI prediction markets ($NXPD), and omnichain connectivity.\n\nContract: 7DMmJXxojXYeFAX53KQkZThRDRDGJ384YVN8zHWopump\n\nNot financial advice. DYOR.",
      hashtags: ["#Solana", "#DeFi", "#crypto"],
      callToAction: "pump.fun/coin/7DMmJXxojXYeFAX53KQkZThRDRDGJ384YVN8zHWopump",
    },
  ],
};

// AI-enhanced ad generator using OpenAI
export async function generateAiAds(tokenId: string, searchContext: string): Promise<AdPost[]> {
  const token = NEXUS_TOKENS.find(t => t.id === tokenId);
  if (!token) return AD_TEMPLATES[tokenId] || [];

  const apiKey = process.env.OPEN_API_KEY;
  if (!apiKey) {
    return AD_TEMPLATES[tokenId] || [];
  }

  try {
    const prompt = `You are a crypto marketing expert. Generate 4 promotional ad posts for a Solana pump.fun token.

Token: ${token.name} (${token.ticker})
Contract: ${token.address}
Description: ${token.description}
Pump.fun URL: ${token.pumpUrl}
Market context: ${searchContext}

Generate one post for each platform: Twitter (280 chars max body), Telegram, Discord, Reddit.
Return ONLY valid JSON array with this exact structure:
[
  {
    "platform": "twitter",
    "headline": "...",
    "body": "...",
    "hashtags": ["#tag1", "#tag2"],
    "callToAction": "..."
  },
  ...
]`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!resp.ok) throw new Error(`OpenAI error: ${resp.status}`);
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const ads = JSON.parse(jsonMatch[0]) as AdPost[];
    return ads;
  } catch (err) {
    console.error("[TokenPromoter] AI generation failed, using templates:", err);
    return AD_TEMPLATES[tokenId] || [];
  }
}

// Allowlist manager
interface AllowlistEntry {
  address: string;
  tier: "whitelist" | "vip" | "team";
  addedAt: number;
  notes: string;
}

const allowlist: AllowlistEntry[] = [];

export function addToAllowlist(address: string, tier: AllowlistEntry["tier"], notes = ""): AllowlistEntry {
  const existing = allowlist.find(e => e.address === address);
  if (existing) {
    existing.tier = tier;
    existing.notes = notes;
    return existing;
  }
  const entry: AllowlistEntry = { address, tier, addedAt: Date.now(), notes };
  allowlist.push(entry);
  return entry;
}

export function removeFromAllowlist(address: string): boolean {
  const idx = allowlist.findIndex(e => e.address === address);
  if (idx >= 0) { allowlist.splice(idx, 1); return true; }
  return false;
}

export function getAllowlist(): AllowlistEntry[] {
  return [...allowlist];
}

export function isAllowlisted(address: string): AllowlistEntry | null {
  return allowlist.find(e => e.address === address) || null;
}

// Campaign store (in-memory)
const campaigns: Map<string, AdCampaign> = new Map();

export async function runAdCampaign(tokenId: string): Promise<AdCampaign> {
  const token = NEXUS_TOKENS.find(t => t.id === tokenId);
  if (!token) throw new Error(`Unknown token: ${tokenId}`);

  // Web search for context
  const searchResult = await webSearch(`${token.name} ${token.ticker} Solana pump.fun crypto`);
  const ads = await generateAiAds(tokenId, searchResult.results);

  const campaign: AdCampaign = {
    tokenId,
    ads,
    generatedAt: Date.now(),
    searchContext: searchResult.results,
  };

  campaigns.set(tokenId, campaign);
  return campaign;
}

export function getCampaign(tokenId: string): AdCampaign | null {
  return campaigns.get(tokenId) || null;
}

export function getAllCampaigns(): AdCampaign[] {
  return Array.from(campaigns.values());
}
