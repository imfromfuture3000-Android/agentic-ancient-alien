import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { CyberCard } from "./CyberCard";
import { GlitchText } from "./GlitchText";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Play, Square, Bot, Activity, TrendingUp, Zap, 
  Radio, Shield, Cpu, Coins, BarChart3, Clock,
  Wifi, AlertCircle, CheckCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AgentStrategy {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  successRate: number;
  totalExecutions: number;
  totalProfit: number;
}

interface AgentLog {
  timestamp: number;
  level: "info" | "success" | "warning" | "error";
  message: string;
  data?: Record<string, unknown>;
}

interface AgentStatus {
  isRunning: boolean;
  cycleCount: number;
  totalEarnings: number;
  totalTransactions: number;
  lastCycleTime: number;
  strategies: AgentStrategy[];
  logs: AgentLog[];
  metrics: {
    uptime: number;
    cyclesPerHour: number;
    avgCycleTime: number;
    successRate: number;
    networkLatency: number;
    rpcHealth: { helius: boolean; alchemy: boolean; moralis: boolean };
  };
  config: {
    network: string;
    treasury: string;
  };
}

export function RalphAgentPanel() {
  const { data: status, isLoading } = useQuery<AgentStatus>({
    queryKey: ["/api/agent/status"],
    refetchInterval: 2000
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agent/start", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/status"] });
    }
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/agent/stop", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/status"] });
    }
  });

  const toggleStrategyMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const res = await apiRequest("POST", `/api/agent/strategy/${id}`, { enabled });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/status"] });
    }
  });

  const switchNetworkMutation = useMutation({
    mutationFn: async (network: "devnet" | "mainnet") => {
      const res = await apiRequest("POST", "/api/agent/network", { network });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agent/status"] });
    }
  });

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case "success": return <CheckCircle className="w-3 h-3 text-green-400" />;
      case "warning": return <AlertCircle className="w-3 h-3 text-yellow-400" />;
      case "error": return <AlertCircle className="w-3 h-3 text-red-400" />;
      default: return <Radio className="w-3 h-3 text-cyan-400" />;
    }
  };

  if (isLoading) {
    return (
      <CyberCard className="animate-pulse">
        <div className="text-center py-8 text-muted-foreground">
          <Bot className="w-8 h-8 mx-auto mb-2 animate-bounce" />
          INITIALIZING RALPH AGENT BOT...
        </div>
      </CyberCard>
    );
  }

  return (
    <div className="space-y-6">
      <CyberCard variant="primary">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-primary animate-pulse" />
            <h3 className="text-lg font-bold text-primary">
              <GlitchText text="RALPH AGENT BOT" />
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status?.isRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {status?.isRunning ? 'RUNNING' : 'STOPPED'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-black/50 p-3 border border-primary/30 text-center">
            <Coins className="w-4 h-4 mx-auto text-primary mb-1" />
            <div className="text-lg font-bold text-primary">{status?.totalEarnings.toFixed(8) || 0}</div>
            <div className="text-xs text-muted-foreground">SOL EARNED</div>
          </div>
          <div className="bg-black/50 p-3 border border-cyan-500/30 text-center">
            <Activity className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
            <div className="text-lg font-bold text-white">{status?.cycleCount || 0}</div>
            <div className="text-xs text-muted-foreground">CYCLES</div>
          </div>
          <div className="bg-black/50 p-3 border border-purple-500/30 text-center">
            <TrendingUp className="w-4 h-4 mx-auto text-purple-400 mb-1" />
            <div className="text-lg font-bold text-purple-400">{status?.metrics.successRate.toFixed(1) || 0}%</div>
            <div className="text-xs text-muted-foreground">SUCCESS</div>
          </div>
          <div className="bg-black/50 p-3 border border-orange-500/30 text-center">
            <Clock className="w-4 h-4 mx-auto text-orange-400 mb-1" />
            <div className="text-lg font-bold text-orange-400">{formatUptime(status?.metrics.uptime || 0)}</div>
            <div className="text-xs text-muted-foreground">UPTIME</div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => status?.isRunning ? stopMutation.mutate() : startMutation.mutate()}
            disabled={startMutation.isPending || stopMutation.isPending}
            className={`flex-1 ${status?.isRunning 
              ? 'bg-red-600 hover:bg-red-500' 
              : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'
            } text-white border-0`}
            data-testid="button-agent-toggle"
          >
            {status?.isRunning ? (
              <span className="flex items-center gap-2">
                <Square className="w-4 h-4" /> STOP AGENT
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4" /> START EMPIRE BUILDING
              </span>
            )}
          </Button>
          
          <Button
            onClick={() => switchNetworkMutation.mutate(status?.config.network === "devnet" ? "mainnet" : "devnet")}
            disabled={switchNetworkMutation.isPending}
            variant="outline"
            className="border-white/20"
            data-testid="button-switch-network"
          >
            {status?.config.network?.toUpperCase() || "DEVNET"}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className={`p-2 border text-center ${status?.metrics.rpcHealth?.helius ? 'border-green-500/50 text-green-400' : 'border-red-500/50 text-red-400'}`}>
            <Wifi className="w-3 h-3 mx-auto mb-1" />
            HELIUS: {status?.metrics.rpcHealth?.helius ? 'OK' : 'ERR'}
          </div>
          <div className={`p-2 border text-center ${status?.metrics.rpcHealth?.alchemy ? 'border-green-500/50 text-green-400' : 'border-yellow-500/50 text-yellow-400'}`}>
            <Wifi className="w-3 h-3 mx-auto mb-1" />
            ALCHEMY: {status?.metrics.rpcHealth?.alchemy ? 'OK' : 'N/A'}
          </div>
          <div className={`p-2 border text-center ${status?.metrics.rpcHealth?.moralis ? 'border-green-500/50 text-green-400' : 'border-yellow-500/50 text-yellow-400'}`}>
            <Wifi className="w-3 h-3 mx-auto mb-1" />
            MORALIS: {status?.metrics.rpcHealth?.moralis ? 'OK' : 'N/A'}
          </div>
        </div>
      </CyberCard>

      <CyberCard>
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <span className="text-sm text-cyan-400 font-bold">STRATEGIES</span>
        </div>
        
        <div className="space-y-2">
          {status?.strategies.map((strategy) => (
            <div 
              key={strategy.id}
              className={`p-3 border ${strategy.enabled ? 'border-primary/30 bg-primary/5' : 'border-white/10'} transition-all`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={strategy.enabled}
                    onCheckedChange={(checked) => toggleStrategyMutation.mutate({ id: strategy.id, enabled: checked })}
                    data-testid={`switch-strategy-${strategy.id}`}
                  />
                  <span className={`text-sm font-bold ${strategy.enabled ? 'text-white' : 'text-muted-foreground'}`}>
                    {strategy.name}
                  </span>
                </div>
                <span className={`text-xs ${strategy.successRate > 70 ? 'text-green-400' : strategy.successRate > 40 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                  {strategy.successRate.toFixed(0)}% success
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Executions: {strategy.totalExecutions}</span>
                <span className="text-primary">+{strategy.totalProfit.toFixed(8)} SOL</span>
              </div>
            </div>
          ))}
        </div>
      </CyberCard>

      <CyberCard>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-sm text-cyan-400 font-bold">AGENT LOGS</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {status?.metrics.cyclesPerHour.toFixed(1)} cycles/hr
          </span>
        </div>
        
        <div className="space-y-1 max-h-64 overflow-y-auto">
          <AnimatePresence>
            {status?.logs.slice(0, 20).map((log, index) => (
              <motion.div
                key={`${log.timestamp}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-2 text-xs border-l-2 ${
                  log.level === 'success' ? 'border-green-500 bg-green-500/5' :
                  log.level === 'warning' ? 'border-yellow-500 bg-yellow-500/5' :
                  log.level === 'error' ? 'border-red-500 bg-red-500/5' :
                  'border-cyan-500 bg-cyan-500/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  {getLogIcon(log.level)}
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <div className="text-white mt-1">{log.message}</div>
                {log.data && (
                  <div className="text-muted-foreground mt-1 font-mono">
                    {JSON.stringify(log.data).slice(0, 100)}...
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {(!status?.logs || status.logs.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No logs yet. Start the agent to begin Empire building.
            </div>
          )}
        </div>
      </CyberCard>
    </div>
  );
}
