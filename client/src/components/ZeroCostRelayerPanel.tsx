import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { CyberCard } from "./CyberCard";
import { GlitchText } from "./GlitchText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Send, Activity, TrendingDown, Zap, CheckCircle, Radio
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RelayerStats {
  totalTransactions: number;
  totalSavings: number;
  averageSavingsPerTx: number;
  status: string;
  config: {
    cac_i_enabled: boolean;
    ace_microstructure_enabled: boolean;
    quantum_entanglement: boolean;
  };
  recentTransactions: Array<{
    id: number;
    fromAddress: string;
    toAddress: string;
    originalFee: string;
    actualFee: string;
    savings: string;
    status: string;
    txHash: string;
    timestamp: string;
  }>;
}

interface RelayResult {
  success: boolean;
  originalFee: number;
  actualFee: number;
  savings: number;
  savingsPercentage: string;
  txHash: string;
  relayerWhisper: string;
  zkProof: string;
}

export function ZeroCostRelayerPanel() {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("0.001");
  const [lastRelay, setLastRelay] = useState<RelayResult | null>(null);

  const { data: stats, isLoading } = useQuery<RelayerStats>({
    queryKey: ["/api/relayer/stats"],
    refetchInterval: 5000
  });

  const relayMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/relayer/relay", {
        from: "0xUSER_WALLET",
        to: toAddress || "0xTREASURY",
        amount: parseFloat(amount),
        fee: 0.000005
      });
      return res.json();
    },
    onSuccess: (data) => {
      setLastRelay(data);
      queryClient.invalidateQueries({ queryKey: ["/api/relayer/stats"] });
    }
  });

  return (
    <div className="space-y-6">
      <CyberCard variant="primary">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Send className="w-6 h-6 text-cyan-400" />
            <h3 className="text-lg font-bold text-cyan-400">
              <GlitchText text="ZERO-COST RELAYER" />
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${stats?.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">{stats?.status || 'INITIALIZING'}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-black/50 p-3 border border-cyan-500/30 text-center">
            <Activity className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
            <div className="text-lg font-bold text-white">{stats?.totalTransactions || 0}</div>
            <div className="text-xs text-muted-foreground">RELAYED</div>
          </div>
          <div className="bg-black/50 p-3 border border-green-500/30 text-center">
            <TrendingDown className="w-4 h-4 mx-auto text-green-400 mb-1" />
            <div className="text-lg font-bold text-primary">{stats?.totalSavings.toFixed(8) || 0}</div>
            <div className="text-xs text-muted-foreground">SOL SAVED</div>
          </div>
          <div className="bg-black/50 p-3 border border-purple-500/30 text-center">
            <Zap className="w-4 h-4 mx-auto text-purple-400 mb-1" />
            <div className="text-lg font-bold text-purple-400">1000x</div>
            <div className="text-xs text-muted-foreground">ZK COMPRESS</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
          <div className={`p-2 border text-center ${stats?.config.cac_i_enabled ? 'border-green-500/50 text-green-400' : 'border-white/10 text-muted-foreground'}`}>
            CAC-I: {stats?.config.cac_i_enabled ? 'ON' : 'OFF'}
          </div>
          <div className={`p-2 border text-center ${stats?.config.ace_microstructure_enabled ? 'border-green-500/50 text-green-400' : 'border-white/10 text-muted-foreground'}`}>
            ACE: {stats?.config.ace_microstructure_enabled ? 'ON' : 'OFF'}
          </div>
          <div className={`p-2 border text-center ${stats?.config.quantum_entanglement ? 'border-green-500/50 text-green-400' : 'border-white/10 text-muted-foreground'}`}>
            QUANTUM: {stats?.config.quantum_entanglement ? 'ON' : 'OFF'}
          </div>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Recipient Address (optional)"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            className="bg-black/50 border-white/20 text-white placeholder:text-muted-foreground"
            data-testid="input-relay-to"
          />
          <Input
            placeholder="Amount SOL"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            step="0.001"
            className="bg-black/50 border-white/20 text-white placeholder:text-muted-foreground"
            data-testid="input-relay-amount"
          />
          <Button
            onClick={() => relayMutation.mutate()}
            disabled={relayMutation.isPending}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-0"
            data-testid="button-relay-tx"
          >
            {relayMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Radio className="w-4 h-4 animate-spin" /> RELAYING...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" /> RELAY ZERO-COST
              </span>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {lastRelay && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-3 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30"
            >
              <div className="flex items-center gap-2 text-cyan-400 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-bold">RELAY SUCCESSFUL</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Original Fee: <span className="text-white">{lastRelay.originalFee} SOL</span></div>
                <div>Actual Fee: <span className="text-primary">{lastRelay.actualFee} SOL</span></div>
                <div>Savings: <span className="text-green-400">{lastRelay.savingsPercentage}</span></div>
                <div>ZK Proof: <span className="text-purple-400 font-mono">{lastRelay.zkProof}</span></div>
                <div className="italic text-secondary pt-1">"{lastRelay.relayerWhisper}"</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CyberCard>

      {stats?.recentTransactions && stats.recentTransactions.length > 0 && (
        <CyberCard>
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-sm text-cyan-400 font-bold">RECENT RELAYS</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stats.recentTransactions.map((tx) => (
              <div key={tx.id} className="p-2 bg-black/30 border border-white/5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-mono">{tx.txHash}</span>
                  <span className="text-green-400">-{parseFloat(tx.savings).toFixed(8)} SOL</span>
                </div>
                <div className="text-muted-foreground mt-1">
                  {tx.timestamp && formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        </CyberCard>
      )}
    </div>
  );
}
