import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import {
  Brain, Zap, Shield, Code2, Database, Globe, Cpu, RefreshCw,
  AlertTriangle, CheckCircle, XCircle, Info, Wrench, Coins,
  Play, Square, Search, Link, BookOpen, TrendingUp, Activity,
} from "lucide-react";

interface ScanResult {
  type: "error" | "warning" | "fix" | "asset" | "skill" | "info";
  file?: string;
  line?: number;
  message: string;
  fixApplied?: string;
  timestamp: number;
}

interface OwnedAsset {
  address: string;
  assetType: "token" | "program" | "domain" | "nft" | "rwa";
  name: string;
  symbol?: string;
  balance?: number;
  ownerWallet: string;
  transferStatus: "owned" | "needs_transfer" | "transferred";
  onChainData?: Record<string, unknown>;
}

interface AgentSkill {
  id: string;
  name: string;
  category: "rpc" | "defi" | "security" | "code" | "asset" | "ai";
  description: string;
  learnedAt: number;
  confidence: number;
  usageCount: number;
}

interface LearningState {
  isRunning: boolean;
  cycleCount: number;
  scanResults: ScanResult[];
  ownedAssets: OwnedAsset[];
  skills: AgentSkill[];
  errorsFixed: number;
  filesScanned: number;
  lastScanTime: number;
  repoHealth: number;
  logs: Array<{ ts: number; level: string; msg: string }>;
}

const SCAN_ICONS: Record<string, JSX.Element> = {
  error: <XCircle className="w-3 h-3 text-red-400 shrink-0" />,
  warning: <AlertTriangle className="w-3 h-3 text-yellow-400 shrink-0" />,
  fix: <Wrench className="w-3 h-3 text-green-400 shrink-0" />,
  skill: <Brain className="w-3 h-3 text-purple-400 shrink-0" />,
  asset: <Coins className="w-3 h-3 text-cyan-400 shrink-0" />,
  info: <Info className="w-3 h-3 text-blue-400 shrink-0" />,
};

const SCAN_COLORS: Record<string, string> = {
  error: "text-red-400",
  warning: "text-yellow-400",
  fix: "text-green-400",
  skill: "text-purple-400",
  asset: "text-cyan-400",
  info: "text-blue-400",
};

const CATEGORY_ICONS: Record<string, JSX.Element> = {
  rpc: <Globe className="w-3 h-3" />,
  defi: <Coins className="w-3 h-3" />,
  security: <Shield className="w-3 h-3" />,
  code: <Code2 className="w-3 h-3" />,
  asset: <Database className="w-3 h-3" />,
  ai: <Brain className="w-3 h-3" />,
};

const ASSET_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  token: { label: "SPL TOKEN", color: "text-green-400 border-green-400/30" },
  program: { label: "PROGRAM", color: "text-purple-400 border-purple-400/30" },
  domain: { label: ".SOL DOMAIN", color: "text-cyan-400 border-cyan-400/30" },
  nft: { label: "NFT", color: "text-pink-400 border-pink-400/30" },
  rwa: { label: "RWA", color: "text-yellow-400 border-yellow-400/30" },
};

function HealthBar({ value }: { value: number }) {
  const color = value > 80 ? "bg-green-400" : value > 50 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-xs font-mono font-bold ${color.replace("bg-", "text-")}`}>
        {value}%
      </span>
    </div>
  );
}

export function SelfLearningPanel() {
  const qc = useQueryClient();
  const [activeView, setActiveView] = useState<"console" | "assets" | "skills">("console");

  const { data: state, isLoading } = useQuery<LearningState>({
    queryKey: ["/api/learn/status"],
    refetchInterval: 3000,
  });

  const startMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/learn/start"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/learn/status"] }),
  });

  const stopMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/learn/stop"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/learn/status"] }),
  });

  const scanMut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/learn/scan"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/learn/status"] }),
  });

  const { data: assets, refetch: refetchAssets, isFetching: fetchingAssets } = useQuery<OwnedAsset[]>({
    queryKey: ["/api/learn/assets"],
    enabled: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-green-400 font-mono animate-pulse">
        INITIALIZING NEURAL LEARNING MATRIX...
      </div>
    );
  }

  const s = state!;
  const errors = (s.scanResults || []).filter((r) => r.type === "error").length;
  const warnings = (s.scanResults || []).filter((r) => r.type === "warning").length;
  const fixes = (s.scanResults || []).filter((r) => r.type === "fix").length;

  return (
    <div className="space-y-4 font-mono text-sm" data-testid="self-learning-panel">
      {/* Header */}
      <div className="border border-purple-500/30 bg-purple-950/20 rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-purple-400 animate-pulse" />
            <div>
              <div className="text-purple-300 font-bold tracking-widest text-xs uppercase">
                SELF-LEARNING AGENT v2.0
              </div>
              <div className="text-gray-500 text-xs">Autonomous Repo Scanner · Asset Hunter · Bug Fixer</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {s.isRunning ? (
              <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 animate-pulse">
                ● LEARNING 24/7
              </Badge>
            ) : (
              <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30">
                ○ OFFLINE
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div className="bg-black/40 border border-purple-500/20 rounded p-2 text-center">
            <div className="text-purple-400 text-lg font-bold" data-testid="stat-cycles">{s.cycleCount}</div>
            <div className="text-gray-500 text-xs">CYCLES</div>
          </div>
          <div className="bg-black/40 border border-blue-500/20 rounded p-2 text-center">
            <div className="text-blue-400 text-lg font-bold" data-testid="stat-skills">{s.skills?.length || 0}</div>
            <div className="text-gray-500 text-xs">SKILLS LEARNED</div>
          </div>
          <div className="bg-black/40 border border-green-500/20 rounded p-2 text-center">
            <div className="text-green-400 text-lg font-bold" data-testid="stat-fixed">{s.errorsFixed}</div>
            <div className="text-gray-500 text-xs">BUGS FIXED</div>
          </div>
          <div className="bg-black/40 border border-cyan-500/20 rounded p-2 text-center">
            <div className="text-cyan-400 text-lg font-bold" data-testid="stat-files">{s.filesScanned}</div>
            <div className="text-gray-500 text-xs">FILES SCANNED</div>
          </div>
        </div>

        {/* Repo Health */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>REPO HEALTH</span>
            <span>{errors} errors · {warnings} warnings · {fixes} fixes applied</span>
          </div>
          <HealthBar value={s.repoHealth ?? 100} />
        </div>

        {/* Controls */}
        <div className="flex gap-2 flex-wrap">
          {!s.isRunning ? (
            <Button
              size="sm"
              className="bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 h-7 text-xs"
              onClick={() => startMut.mutate()}
              disabled={startMut.isPending}
              data-testid="btn-learn-start"
            >
              <Play className="w-3 h-3 mr-1" /> START LEARNING
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="border-red-500/30 text-red-400 h-7 text-xs"
              onClick={() => stopMut.mutate()}
              disabled={stopMut.isPending}
              data-testid="btn-learn-stop"
            >
              <Square className="w-3 h-3 mr-1" /> STOP
            </Button>
          )}
          <Button
            size="sm"
            className="bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/30 text-cyan-300 h-7 text-xs"
            onClick={() => scanMut.mutate()}
            disabled={scanMut.isPending}
            data-testid="btn-scan-now"
          >
            <Search className="w-3 h-3 mr-1" />
            {scanMut.isPending ? "SCANNING..." : "SCAN NOW"}
          </Button>
          <Button
            size="sm"
            className="bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-500/30 text-yellow-300 h-7 text-xs"
            onClick={() => refetchAssets()}
            disabled={fetchingAssets}
            data-testid="btn-scan-assets"
          >
            <Coins className="w-3 h-3 mr-1" />
            {fetchingAssets ? "SCANNING..." : "SCAN ASSETS"}
          </Button>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex gap-1">
        {(["console", "assets", "skills"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            data-testid={`tab-learn-${v}`}
            className={`px-3 py-1 text-xs rounded border transition-colors ${
              activeView === v
                ? "bg-purple-600/30 border-purple-500/50 text-purple-300"
                : "bg-black/30 border-gray-700/30 text-gray-500 hover:text-gray-300"
            }`}
          >
            {v === "console" && <Activity className="w-3 h-3 inline mr-1" />}
            {v === "assets" && <Coins className="w-3 h-3 inline mr-1" />}
            {v === "skills" && <BookOpen className="w-3 h-3 inline mr-1" />}
            {v.toUpperCase()}
          </button>
        ))}
      </div>

      {/* CONSOLE VIEW */}
      {activeView === "console" && (
        <div className="space-y-3">
          {/* Live Logs */}
          <div className="border border-green-500/20 rounded bg-black/60">
            <div className="px-3 py-2 border-b border-green-500/20 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${s.isRunning ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
              <span className="text-green-400 text-xs tracking-widest">LIVE AGENT LOG</span>
              {s.lastScanTime > 0 && (
                <span className="text-gray-600 text-xs ml-auto">
                  Last scan: {new Date(s.lastScanTime).toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="h-48 overflow-y-auto p-2 space-y-1 text-xs">
              {(s.logs || []).slice(0, 50).map((l, i) => (
                <div key={i} className="flex items-start gap-2" data-testid={`log-entry-${i}`}>
                  <span className="text-gray-600 shrink-0">{new Date(l.ts).toLocaleTimeString()}</span>
                  {l.level === "success" && <CheckCircle className="w-3 h-3 text-green-400 shrink-0 mt-0.5" />}
                  {l.level === "info" && <Info className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />}
                  {l.level === "warning" && <AlertTriangle className="w-3 h-3 text-yellow-400 shrink-0 mt-0.5" />}
                  {l.level === "error" && <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />}
                  <span
                    className={
                      l.level === "success" ? "text-green-300" :
                      l.level === "warning" ? "text-yellow-300" :
                      l.level === "error" ? "text-red-300" : "text-gray-300"
                    }
                  >
                    {l.msg}
                  </span>
                </div>
              ))}
              {(!s.logs || s.logs.length === 0) && (
                <div className="text-gray-600 text-center py-4">No logs yet — start the agent</div>
              )}
            </div>
          </div>

          {/* Scan Results */}
          <div className="border border-gray-700/30 rounded bg-black/40">
            <div className="px-3 py-2 border-b border-gray-700/30 flex items-center justify-between">
              <span className="text-gray-400 text-xs tracking-widest">REPO SCAN RESULTS</span>
              <span className="text-gray-600 text-xs">{s.scanResults?.length || 0} entries</span>
            </div>
            <div className="h-56 overflow-y-auto p-2 space-y-1 text-xs">
              {(s.scanResults || []).slice(0, 60).map((r, i) => (
                <div key={i} className="flex items-start gap-2 py-0.5" data-testid={`scan-result-${i}`}>
                  {SCAN_ICONS[r.type]}
                  <div className="min-w-0 flex-1">
                    {r.file && (
                      <span className="text-gray-500 mr-1">
                        {r.file.split("/").slice(-2).join("/")}
                        {r.line ? `:${r.line}` : ""}
                      </span>
                    )}
                    <span className={SCAN_COLORS[r.type]}>{r.message}</span>
                    {r.fixApplied && (
                      <span className="ml-2 text-green-500">✓ {r.fixApplied}</span>
                    )}
                  </div>
                  <span className="text-gray-700 shrink-0 text-xs">
                    {new Date(r.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {(!s.scanResults || s.scanResults.length === 0) && (
                <div className="text-gray-600 text-center py-4">No scan results yet — click SCAN NOW</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ASSETS VIEW */}
      {activeView === "assets" && (
        <div className="space-y-3">
          <div className="border border-yellow-500/20 bg-yellow-950/10 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-300 text-xs font-bold tracking-widest">OWNED PROGRAMS · RWA · DOMAINS</span>
            </div>
            <p className="text-gray-500 text-xs">
              On-chain asset scanner checks treasury wallet{" "}
              <span className="text-cyan-400 font-mono">8z5D9j...gEF9</span> for SPL tokens,
              .sol domains (Bonfida SNS), RWA assets, and Nexus contract ownership.
            </p>
          </div>

          <div className="space-y-2">
            {((assets || s.ownedAssets) || []).map((asset, i) => {
              const typeStyle = ASSET_TYPE_LABELS[asset.assetType] || { label: asset.assetType.toUpperCase(), color: "text-gray-400 border-gray-500/30" };
              return (
                <div
                  key={i}
                  className="border border-gray-700/40 bg-black/40 rounded p-3"
                  data-testid={`asset-card-${i}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs border rounded px-1 py-0.5 ${typeStyle.color}`}>
                          {typeStyle.label}
                        </span>
                        <span className="text-white text-xs font-bold">{asset.name}</span>
                        {asset.symbol && (
                          <span className="text-cyan-400 text-xs">${asset.symbol}</span>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs font-mono truncate">
                        {asset.address.slice(0, 20)}...{asset.address.slice(-8)}
                      </div>
                      {asset.balance !== undefined && (
                        <div className="text-green-400 text-xs mt-1">
                          Balance: {asset.balance.toFixed(6)} {asset.symbol || "tokens"}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge
                        className={
                          asset.transferStatus === "owned"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20 text-xs"
                            : asset.transferStatus === "needs_transfer"
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs"
                        }
                      >
                        {asset.transferStatus.replace("_", " ").toUpperCase()}
                      </Badge>
                      <a
                        href={`https://solscan.io/account/${asset.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-cyan-400 transition-colors"
                        data-testid={`asset-link-${i}`}
                      >
                        <Link className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  {asset.onChainData && (
                    <div className="mt-2 text-xs text-gray-600 font-mono">
                      {Object.entries(asset.onChainData).slice(0, 3).map(([k, v]) => (
                        <span key={k} className="mr-3">{k}: {String(v).slice(0, 20)}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {((assets || s.ownedAssets) || []).length === 0 && (
              <div className="text-center py-8 text-gray-600">
                <Coins className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <div>Click SCAN ASSETS to discover on-chain holdings</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SKILLS VIEW */}
      {activeView === "skills" && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {(["rpc", "defi", "security", "code", "asset", "ai"] as const).map((cat) => {
              const count = (s.skills || []).filter((sk) => sk.category === cat).length;
              return (
                <div key={cat} className="bg-black/40 border border-gray-700/30 rounded p-2 flex items-center gap-2">
                  <span className="text-gray-400">{CATEGORY_ICONS[cat]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-300 capitalize">{cat}</div>
                    <div className="text-xs text-gray-600">{count} skills</div>
                  </div>
                  <span className="text-cyan-400 text-sm font-bold">{count}</span>
                </div>
              );
            })}
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {(s.skills || []).slice(0, 50).map((skill, i) => (
              <div
                key={i}
                className="border border-gray-700/30 bg-black/30 rounded p-2"
                data-testid={`skill-card-${i}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-400 shrink-0">{CATEGORY_ICONS[skill.category]}</span>
                    <div className="min-w-0">
                      <div className="text-xs text-white font-bold truncate">{skill.name}</div>
                      <div className="text-xs text-gray-500 truncate">{skill.description}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-400" />
                      <span className="text-green-400 text-xs">{Math.round(skill.confidence * 100)}%</span>
                    </div>
                    <span className="text-gray-600 text-xs">×{skill.usageCount}</span>
                  </div>
                </div>
                <div className="mt-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${skill.confidence * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {(!s.skills || s.skills.length === 0) && (
              <div className="text-center py-8 text-gray-600">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <div>Start the agent to begin learning</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom ticker */}
      <div className="border border-purple-500/10 bg-black/30 rounded p-2 flex items-center gap-3 overflow-hidden">
        <Cpu className="w-3 h-3 text-purple-400 shrink-0 animate-spin" style={{ animationDuration: "3s" }} />
        <div className="text-xs text-gray-600 font-mono truncate">
          {s.isRunning
            ? `▶ CYCLE #${s.cycleCount} · ${s.skills?.length || 0} SKILLS · ${s.filesScanned} FILES · ${s.errorsFixed} BUGS FIXED · NEXT SCAN IN ~45s`
            : "◼ AGENT OFFLINE · START LEARNING MODE TO BEGIN AUTONOMOUS OPERATION"}
        </div>
      </div>
    </div>
  );
}
