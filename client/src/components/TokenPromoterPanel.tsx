import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { CyberCard } from "./CyberCard";
import { GlitchText } from "./GlitchText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Megaphone, ExternalLink, Copy, RefreshCw, Search,
  Shield, UserPlus, Trash2, CheckCircle, Twitter,
  MessageCircle, Hash, Globe, Zap, Activity, Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const TOKENS = [
  { id: "nexus", name: "NexusOracle", ticker: "$NEXUS", color: "#00ff88", address: "FSj2iWrjQWKRUfLJ8UKTwStW6Yz3njZW8mAL4sbxpump" },
  { id: "nxpd",  name: "NexusPredict", ticker: "$NXPD",  color: "#00ccff", address: "CwFLxN2Hq6rBwDZqtuUhBF59dCHj6y71XHM7o7dcpump" },
  { id: "omni",  name: "OMNINEXUS",    ticker: "$OMNI",  color: "#aa44ff", address: "7DMmJXxojXYeFAX53KQkZThRDRDGJ384YVN8zHWopump" },
];

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  twitter:  <Twitter className="w-3 h-3" />,
  telegram: <MessageCircle className="w-3 h-3" />,
  discord:  <Hash className="w-3 h-3" />,
  reddit:   <Globe className="w-3 h-3" />,
};

interface TokenInfo {
  id: string; name: string; ticker: string; address: string; pumpUrl: string;
  color: string; solBalance: number; holderCount: number | null;
  recentTxCount: number; lastActivity: number | null; marketCap: string;
}

interface AdPost {
  platform: string; headline: string; body: string; hashtags: string[]; callToAction: string;
}

interface Campaign {
  tokenId: string; ads: AdPost[]; generatedAt: number; searchContext: string;
}

interface AllowlistEntry {
  address: string; tier: "whitelist" | "vip" | "team"; addedAt: number; notes: string;
}

interface SearchResult { query: string; results: string; timestamp: number; }

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function AdCard({ ad }: { ad: AdPost }) {
  const [copied, setCopied] = useState(false);
  const fullText = `${ad.headline}\n\n${ad.body}\n\n${ad.hashtags.join(" ")}\n\n${ad.callToAction}`;
  const handleCopy = () => {
    copyToClipboard(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="border border-white/10 bg-black/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1 bg-white/10 rounded">{PLATFORM_ICONS[ad.platform]}</span>
          <span className="text-xs font-bold text-white uppercase tracking-wider">{ad.platform}</span>
        </div>
        <Button
          size="sm" variant="ghost"
          onClick={handleCopy}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-white"
          data-testid={`button-copy-ad-${ad.platform}`}
        >
          {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
        </Button>
      </div>
      <div className="text-xs font-bold text-primary">{ad.headline}</div>
      <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{ad.body}</div>
      <div className="flex flex-wrap gap-1">
        {ad.hashtags.map(h => (
          <span key={h} className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary/80 border border-primary/20">{h}</span>
        ))}
      </div>
      <div className="text-[10px] text-cyan-400 font-mono break-all">{ad.callToAction}</div>
    </div>
  );
}

function TokenCard({ token, info }: { token: typeof TOKENS[0]; info?: TokenInfo }) {
  const [activeAd, setActiveAd] = useState<AdPost | null>(null);

  const campaignQuery = useQuery<Campaign>({
    queryKey: ["/api/tokens", token.id, "campaign"],
    queryFn: async () => {
      const res = await fetch(`/api/tokens/${token.id}/campaign`);
      if (!res.ok) throw new Error("No campaign yet");
      return res.json();
    },
    retry: false,
  });

  const runCampaign = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/tokens/${token.id}/campaign`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tokens", token.id, "campaign"] });
    },
  });

  return (
    <CyberCard className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: token.color }} />
          <span className="font-bold text-white text-sm">{token.name}</span>
          <span className="text-xs font-mono" style={{ color: token.color }}>{token.ticker}</span>
        </div>
        <a
          href={`https://pump.fun/coin/${token.address}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-white transition-colors"
          data-testid={`link-pump-${token.id}`}
        >
          pump.fun <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-black/50 p-2 border border-white/10 text-center">
          <Activity className="w-3 h-3 mx-auto mb-1" style={{ color: token.color }} />
          <div className="text-xs font-bold text-white">{info?.recentTxCount ?? "—"}</div>
          <div className="text-[10px] text-muted-foreground">TXS</div>
        </div>
        <div className="bg-black/50 p-2 border border-white/10 text-center">
          <Zap className="w-3 h-3 mx-auto mb-1 text-yellow-400" />
          <div className="text-xs font-bold text-white">{info?.marketCap ?? "—"}</div>
          <div className="text-[10px] text-muted-foreground">MKTCAP</div>
        </div>
        <div className="bg-black/50 p-2 border border-white/10 text-center">
          <Clock className="w-3 h-3 mx-auto mb-1 text-muted-foreground" />
          <div className="text-xs font-bold text-white">
            {info?.lastActivity ? formatDistanceToNow(new Date(info.lastActivity), { addSuffix: true }) : "—"}
          </div>
          <div className="text-[10px] text-muted-foreground">LAST TX</div>
        </div>
      </div>

      <div
        className="flex items-center gap-2 bg-black/50 border border-white/10 p-2 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => copyToClipboard(token.address)}
        data-testid={`button-copy-address-${token.id}`}
      >
        <Copy className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        <span className="text-[10px] font-mono text-muted-foreground truncate">{token.address}</span>
      </div>

      <Button
        onClick={() => runCampaign.mutate()}
        disabled={runCampaign.isPending}
        className="w-full text-xs h-8 border-0 text-black font-bold"
        style={{ backgroundColor: token.color }}
        data-testid={`button-run-campaign-${token.id}`}
      >
        {runCampaign.isPending ? (
          <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> GENERATING ADS...</span>
        ) : (
          <span className="flex items-center gap-1"><Megaphone className="w-3 h-3" /> RUN AD CAMPAIGN</span>
        )}
      </Button>

      {campaignQuery.data && (
        <div className="space-y-2">
          <div className="text-[10px] text-muted-foreground border-l-2 border-white/20 pl-2 italic line-clamp-2">
            Web context: {campaignQuery.data.searchContext}
          </div>
          <div className="grid grid-cols-4 gap-1">
            {campaignQuery.data.ads.map((ad, i) => (
              <button
                key={i}
                onClick={() => setActiveAd(activeAd?.platform === ad.platform ? null : ad)}
                className={`flex flex-col items-center gap-1 p-2 border text-[10px] transition-all ${
                  activeAd?.platform === ad.platform
                    ? "border-primary/60 bg-primary/10 text-white"
                    : "border-white/10 text-muted-foreground hover:border-white/30"
                }`}
                data-testid={`button-view-ad-${token.id}-${ad.platform}`}
              >
                {PLATFORM_ICONS[ad.platform]}
                <span className="uppercase">{ad.platform}</span>
              </button>
            ))}
          </div>
          <AnimatePresence>
            {activeAd && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <AdCard ad={activeAd} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </CyberCard>
  );
}

function AllowlistPanel() {
  const [newAddress, setNewAddress] = useState("");
  const [newTier, setNewTier] = useState<"whitelist" | "vip" | "team">("whitelist");
  const [newNotes, setNewNotes] = useState("");

  const { data: entries = [] } = useQuery<AllowlistEntry[]>({ queryKey: ["/api/allowlist"] });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/allowlist", { address: newAddress, tier: newTier, notes: newNotes });
      return res.json();
    },
    onSuccess: () => {
      setNewAddress(""); setNewNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/allowlist"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (address: string) => {
      const res = await fetch(`/api/allowlist/${encodeURIComponent(address)}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/allowlist"] }),
  });

  const TIER_COLORS: Record<string, string> = {
    team: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    vip: "text-purple-400 border-purple-400/30 bg-purple-400/10",
    whitelist: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  };

  return (
    <CyberCard className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-4 h-4 text-cyan-400" />
        <span className="text-sm font-bold text-cyan-400 tracking-wider">ALLOWLIST MANAGER</span>
        <span className="ml-auto text-xs text-muted-foreground">{entries.length} entries</span>
      </div>

      <div className="space-y-2">
        <Input
          placeholder="Solana wallet address..."
          value={newAddress}
          onChange={e => setNewAddress(e.target.value)}
          className="bg-black/50 border-white/20 text-xs font-mono h-8"
          data-testid="input-allowlist-address"
        />
        <div className="flex gap-2">
          <select
            value={newTier}
            onChange={e => setNewTier(e.target.value as "whitelist" | "vip" | "team")}
            className="flex-1 bg-black/50 border border-white/20 text-xs text-white px-2 h-8"
            data-testid="select-allowlist-tier"
          >
            <option value="whitelist">WHITELIST</option>
            <option value="vip">VIP</option>
            <option value="team">TEAM</option>
          </select>
          <Input
            placeholder="Notes (optional)"
            value={newNotes}
            onChange={e => setNewNotes(e.target.value)}
            className="flex-1 bg-black/50 border-white/20 text-xs h-8"
            data-testid="input-allowlist-notes"
          />
          <Button
            onClick={() => addMutation.mutate()}
            disabled={!newAddress || addMutation.isPending}
            size="sm" className="h-8 bg-cyan-600 hover:bg-cyan-500 text-white border-0"
            data-testid="button-add-allowlist"
          >
            <UserPlus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-1 max-h-48 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-xs">No entries yet.</div>
        ) : entries.map(entry => (
          <div key={entry.address} className="flex items-center gap-2 p-2 border border-white/5 bg-black/30 text-xs">
            <span className={`px-1.5 py-0.5 border text-[10px] font-bold uppercase ${TIER_COLORS[entry.tier]}`}>
              {entry.tier}
            </span>
            <span className="font-mono text-muted-foreground truncate flex-1">
              {entry.address.slice(0, 8)}...{entry.address.slice(-6)}
            </span>
            {entry.notes && <span className="text-muted-foreground italic text-[10px]">{entry.notes}</span>}
            <button
              onClick={() => removeMutation.mutate(entry.address)}
              className="text-red-400 hover:text-red-300 ml-auto flex-shrink-0"
              data-testid={`button-remove-allowlist-${entry.address.slice(0, 8)}`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </CyberCard>
  );
}

function WebSearchPanel() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);

  const searchMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/search", { query });
      return res.json() as Promise<SearchResult>;
    },
    onSuccess: data => setResult(data),
  });

  return (
    <CyberCard className="space-y-3">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-primary tracking-wider">WEB SEARCH</span>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Search crypto, DeFi, Solana trends..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && query && searchMutation.mutate()}
          className="bg-black/50 border-white/20 text-xs h-8 flex-1"
          data-testid="input-search-query"
        />
        <Button
          onClick={() => searchMutation.mutate()}
          disabled={!query || searchMutation.isPending}
          size="sm" className="h-8 bg-primary hover:bg-primary/80 text-black border-0 font-bold"
          data-testid="button-search"
        >
          {searchMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
        </Button>
      </div>
      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-black/50 border border-white/10 p-3 space-y-1">
          <div className="text-[10px] text-muted-foreground">
            Query: <span className="text-primary font-mono">{result.query}</span>
            <span className="ml-2">{formatDistanceToNow(new Date(result.timestamp), { addSuffix: true })}</span>
          </div>
          <p className="text-xs text-white leading-relaxed">{result.results}</p>
        </motion.div>
      )}
    </CyberCard>
  );
}

export function TokenPromoterPanel() {
  const { data: tokens, isLoading } = useQuery<TokenInfo[]>({
    queryKey: ["/api/tokens"],
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <CyberCard variant="primary">
        <div className="flex items-center gap-3 mb-2">
          <Megaphone className="w-6 h-6 text-primary animate-pulse" />
          <h3 className="text-lg font-bold text-primary">
            <GlitchText text="NEXUS EMPIRE PROMOTER" />
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Autonomous ad campaign generator for $NEXUS · $NXPD · $OMNI — powered by web search + AI copywriting.
        </p>
      </CyberCard>

      <WebSearchPanel />

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground animate-pulse text-xs">FETCHING TOKEN DATA...</div>
      ) : (
        <div className="space-y-4">
          {TOKENS.map(token => (
            <TokenCard
              key={token.id}
              token={token}
              info={tokens?.find(t => t.id === token.id)}
            />
          ))}
        </div>
      )}

      <AllowlistPanel />
    </div>
  );
}
