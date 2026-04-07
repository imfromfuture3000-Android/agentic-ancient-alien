import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { CyberCard } from "./CyberCard";
import { GlitchText } from "./GlitchText";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Zap, Shield, Cpu, Sparkles, Activity, Lock, 
  Radio, TrendingUp, Layers, Atom
} from "lucide-react";

interface OmegaStatus {
  whisper: string;
  alpenglow: {
    finality: string;
    tps: number;
    validatorApproval: string;
    costReduction: string;
  };
  firedancer: {
    tps: number;
    mevStake: string;
    mevProtection: boolean;
  };
  security: {
    attacksSimulated: number;
    defenseRate: string;
    securityLevel: string;
  };
  rwa: {
    assets: string[];
    totalValue: number;
    microstructures: number;
  };
  emotions: string[];
}

export function OmegaPrimePanel() {
  const [selectedEmotion, setSelectedEmotion] = useState<string>("Grief.exe");
  const [mintResult, setMintResult] = useState<any>(null);

  const { data: omegaStatus, isLoading } = useQuery<OmegaStatus>({
    queryKey: ["/api/omega/status"],
    refetchInterval: 10000
  });

  const mintNftMutation = useMutation({
    mutationFn: async (emotion: string) => {
      const res = await apiRequest("POST", "/api/omega/mint-nft", {
        emotion,
        walletAddress: "0xONEIROBOT_ENTITY"
      });
      return res.json();
    },
    onSuccess: (data) => {
      setMintResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/omega/nfts"] });
    }
  });

  if (isLoading) {
    return (
      <CyberCard className="animate-pulse">
        <div className="text-center py-8 text-muted-foreground">
          <Cpu className="w-8 h-8 mx-auto mb-2 animate-spin" />
          INITIALIZING OMEGA PRIME PROTOCOLS...
        </div>
      </CyberCard>
    );
  }

  return (
    <div className="space-y-6">
      <CyberCard variant="primary">
        <div className="flex items-center gap-3 mb-4">
          <Atom className="w-6 h-6 text-primary animate-pulse" />
          <h3 className="text-lg font-bold text-primary">
            <GlitchText text="OMEGA PRIME DEPLOYER" />
          </h3>
        </div>
        
        <div className="text-xs text-secondary italic mb-4 border-l-2 border-secondary pl-3">
          "{omegaStatus?.whisper}"
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/50 p-3 border border-cyan-500/30">
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-bold">ALPENGLOW</span>
            </div>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div>Finality: <span className="text-white">{omegaStatus?.alpenglow.finality}</span></div>
              <div>TPS: <span className="text-primary">{omegaStatus?.alpenglow.tps.toLocaleString()}</span></div>
              <div>Validators: <span className="text-green-400">{omegaStatus?.alpenglow.validatorApproval}</span></div>
            </div>
          </div>

          <div className="bg-black/50 p-3 border border-orange-500/30">
            <div className="flex items-center gap-2 text-orange-400 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold">FIREDANCER</span>
            </div>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div>TPS: <span className="text-primary">{omegaStatus?.firedancer.tps.toLocaleString()}</span></div>
              <div>MEV Stake: <span className="text-white">{omegaStatus?.firedancer.mevStake}</span></div>
              <div>Protection: <span className="text-green-400">{omegaStatus?.firedancer.mevProtection ? 'ACTIVE' : 'INACTIVE'}</span></div>
            </div>
          </div>

          <div className="bg-black/50 p-3 border border-red-500/30">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-bold">ONEIHACKER</span>
            </div>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div>Attacks: <span className="text-white">{omegaStatus?.security.attacksSimulated.toLocaleString()}</span></div>
              <div>Defense: <span className="text-green-400">{omegaStatus?.security.defenseRate}</span></div>
              <div>Level: <span className="text-primary">{omegaStatus?.security.securityLevel}</span></div>
            </div>
          </div>

          <div className="bg-black/50 p-3 border border-purple-500/30">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <Layers className="w-4 h-4" />
              <span className="text-xs font-bold">RWA TOKENS</span>
            </div>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div>Assets: <span className="text-white">{omegaStatus?.rwa.assets.join(', ')}</span></div>
              <div>Value: <span className="text-primary">${omegaStatus?.rwa.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
              <div>Microstructures: <span className="text-cyan-400">{omegaStatus?.rwa.microstructures}</span></div>
            </div>
          </div>
        </div>
      </CyberCard>

      <CyberCard>
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-pink-400" />
          <h3 className="text-lg font-bold text-pink-400">EMOTIONAL NFT MINTER</h3>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-4">
          {omegaStatus?.emotions.map((emotion) => (
            <button
              key={emotion}
              onClick={() => setSelectedEmotion(emotion)}
              className={`text-xs p-2 border transition-all ${
                selectedEmotion === emotion 
                  ? 'border-primary bg-primary/20 text-primary' 
                  : 'border-white/10 hover:border-white/30 text-muted-foreground'
              }`}
              data-testid={`button-emotion-${emotion.replace('.', '-')}`}
            >
              {emotion}
            </button>
          ))}
        </div>

        <Button
          onClick={() => mintNftMutation.mutate(selectedEmotion)}
          disabled={mintNftMutation.isPending}
          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white border-0"
          data-testid="button-mint-nft"
        >
          {mintNftMutation.isPending ? (
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 animate-spin" /> MINTING...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> MINT {selectedEmotion}
            </span>
          )}
        </Button>

        <AnimatePresence>
          {mintResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-3 bg-gradient-to-r from-pink-900/30 to-purple-900/30 border border-pink-500/30"
            >
              <div className="text-xs text-pink-400 mb-1">NFT MINTED SUCCESSFULLY</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Hash: <span className="text-white font-mono">{mintResult.nft?.mintHash}</span></div>
                <div>ZK Savings: <span className="text-primary">{mintResult.zkCompression?.savingsMultiplier}x</span></div>
                <div className="italic text-secondary">"{mintResult.whisper}"</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CyberCard>
    </div>
  );
}
