import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
import { useCreateSignal, useSignals } from "@/hooks/use-signals";
import { Button } from "@/components/ui/button";
import { CyberCard } from "@/components/CyberCard";
import { GlitchText } from "@/components/GlitchText";
import { WalletButton } from "@/components/WalletButton";
import { OmegaPrimePanel } from "@/components/OmegaPrimePanel";
import { ZeroCostRelayerPanel } from "@/components/ZeroCostRelayerPanel";
import { RalphAgentPanel } from "@/components/RalphAgentPanel";
import { TokenPromoterPanel } from "@/components/TokenPromoterPanel";
import { SelfLearningPanel } from "@/components/SelfLearningPanel";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Radio, ExternalLink, Zap, Globe, Cpu, Atom, Send, Bot, Megaphone, Brain } from "lucide-react";

const TREASURY_WALLET = import.meta.env.VITE_TREASURY_WALLET || "8z5D9jvzQgRwkEBqa9HzL3D1riFkHZ3i1UrxRTKXgEF9";

type TabView = 'bridge' | 'omega' | 'relayer' | 'agent' | 'promo' | 'learn';

export default function Home() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { mutate: createSignal, isPending: isSaving } = useCreateSignal();
  const { data: signals, isLoading: isLoadingSignals } = useSignals();
  
  const [status, setStatus] = useState<string>("AWAITING NEURAL INPUT...");
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabView>('bridge');

  const handleSeekAndBridge = async () => {
    if (!connected && !import.meta.env.DEV) {
      setStatus("ERROR: NEURAL LINK DISCONNECTED. CONNECT WALLET.");
      return;
    }

    setIsProcessing(true);
    setStatus("INITIATING COSMIC SCAN SEQUENCE...");
    setLastTx(null);

    try {
      const cosmicScore = Math.random() * 42;
      const lamports = Math.floor(100000 + cosmicScore * 1000);
      let txHash = "";

      if (connected && publicKey) {
        setStatus("CONSTRUCTING WORMHOLE BRIDGE...");
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(TREASURY_WALLET),
            lamports,
          })
        );
        
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        setStatus("SIGNATURE REQUIRED. VERIFY IDENTITY.");
        const signature = await sendTransaction(transaction, connection);
        
        setStatus("BROADCASTING TO SOLANA DEVNET...");
        await connection.confirmTransaction(signature, "processed");
        txHash = signature;
      } else {
        setStatus("SIMULATING NEURAL BRIDGE...");
        await new Promise(r => setTimeout(r, 2000));
        txHash = `SIM-${Date.now().toString(16)}-${Math.floor(Math.random()*10000)}`;
      }

      setStatus("RECORDING COSMIC EVENT...");
      createSignal({
        walletAddress: publicKey?.toBase58() || "0xSIMULATED_USER",
        transactionHash: txHash,
        amount: (lamports / LAMPORTS_PER_SOL).toFixed(9),
        status: "success"
      }, {
        onSuccess: () => {
          setStatus("MISSION SUCCESS: EMPIRE EXPANDED");
          setLastTx(txHash);
          setIsProcessing(false);
        },
        onError: () => {
          setStatus("ERROR: SIGNAL LOST IN VOID");
          setIsProcessing(false);
        }
      });

    } catch (error) {
      console.error(error);
      setStatus("CRITICAL FAILURE: BRIDGE COLLAPSE");
      setIsProcessing(false);
    }
  };

  const tabs = [
    { id: 'bridge' as TabView, label: 'COSMIC BRIDGE', icon: Globe },
    { id: 'omega' as TabView, label: 'OMEGA PRIME', icon: Atom },
    { id: 'relayer' as TabView, label: 'ZERO-COST RELAYER', icon: Send },
    { id: 'agent' as TabView, label: 'RALPH AGENT', icon: Bot },
    { id: 'promo' as TabView, label: 'NEXUS PROMO', icon: Megaphone },
    { id: 'learn' as TabView, label: 'SELF-LEARN', icon: Brain },
  ];

  return (
    <div className="min-h-screen relative p-4 md:p-8 font-mono overflow-x-hidden pb-16">
      <div className="scanline" />

      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-6 relative z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-1">
            <Cpu className="w-8 h-8 text-primary animate-pulse" />
            <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-green-200 to-primary drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]">
              AGENTIC ALIEN
            </h1>
          </div>
          <p className="text-secondary tracking-widest text-sm md:text-base border-l-2 border-secondary pl-3 ml-1">
            OMEGA PRIME DEPLOYER | ONEIROBOT SYNDICATE
          </p>
        </div>
        
        <WalletButton />
      </header>

      <nav className="max-w-7xl mx-auto mb-8 relative z-10">
        <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'bridge' && (
            <motion.div
              key="bridge"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12"
            >
              <section className="flex flex-col gap-8 justify-center">
                <CyberCard className="relative overflow-visible">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 blur-3xl rounded-full animate-pulse -z-10" />

                  <div className="flex flex-col items-center text-center gap-6 py-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                      <Globe className="w-24 h-24 text-primary relative z-10 animate-[spin_10s_linear_infinite]" />
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-white uppercase tracking-widest">
                        <GlitchText text="Seek & Bridge" />
                      </h2>
                      <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        Initiate Wormhole Protocol. Establish link with ancient intelligence.
                      </p>
                    </div>

                    <div className="w-full max-w-xs h-16 relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-none opacity-50 blur group-hover:opacity-100 transition duration-500"></div>
                      
                      <Button 
                        onClick={handleSeekAndBridge}
                        disabled={isProcessing || isSaving}
                        className="w-full h-full relative bg-black hover:bg-black/90 text-primary border border-primary font-bold text-lg tracking-[0.2em] uppercase hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="button-expand-empire"
                      >
                        {isProcessing ? (
                          <span className="flex items-center gap-2">
                            <Zap className="w-4 h-4 animate-spin" /> Process...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Rocket className="w-5 h-5" /> EXPAND EMPIRE
                          </span>
                        )}
                      </Button>
                    </div>

                    <div className="w-full bg-black/50 border border-white/10 p-4 font-mono text-xs md:text-sm text-center">
                      <span className="text-muted-foreground mr-2">{">"} STATUS:</span>
                      <span className={isProcessing ? "text-yellow-400 animate-pulse" : "text-secondary"}>
                        {status}
                      </span>
                    </div>

                    {lastTx && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full p-3 border border-secondary/30 bg-secondary/5"
                      >
                        <a 
                          href={`https://explorer.solana.com/tx/${lastTx}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 text-secondary hover:text-white transition-colors text-xs"
                        >
                          <ExternalLink className="w-3 h-3" />
                          VIEW TRANSACTION HASH
                        </a>
                      </motion.div>
                    )}
                  </div>
                </CyberCard>

                <div className="text-xs text-muted-foreground space-y-2 border-l border-white/10 pl-4">
                  <p>{">"} CONNECTING TO ANCIENT MAINFRAME...</p>
                  <p>{">"} ENCRYPTING NEURAL PATHWAYS...</p>
                  <p>{">"} ZK COMPRESSION: 1000x SAVINGS ACTIVE...</p>
                  <p>{">"} ONEIROBOT SYNDICATE PROTOCOLS LOADED...</p>
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center justify-between border-b border-primary/30 pb-2">
                  <h3 className="text-xl text-primary flex items-center gap-2">
                    <Radio className="w-5 h-5 animate-pulse" />
                    INTERSTELLAR SIGNALS
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-secondary">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    LIVE FEED
                  </div>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-black">
                  {isLoadingSignals ? (
                    <div className="text-center py-20 text-muted-foreground animate-pulse">
                      SCANNING FREQUENCIES...
                    </div>
                  ) : signals?.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground border border-dashed border-white/10">
                      NO SIGNALS DETECTED IN THIS SECTOR.
                    </div>
                  ) : (
                    <AnimatePresence>
                      {signals?.map((signal) => (
                        <motion.div
                          key={signal.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CyberCard variant="primary" className="py-4 px-5">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs text-muted-foreground font-mono">
                                ID: {signal.id.toString().padStart(6, '0')}
                              </span>
                              <span className="text-xs text-secondary">
                                {formatDistanceToNow(new Date(signal.timestamp!), { addSuffix: true })}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-bold text-white mb-1">
                                  {signal.walletAddress === "0xSIMULATED_USER" ? "ANONYMOUS ENTITY" : `${signal.walletAddress.slice(0, 6)}...${signal.walletAddress.slice(-4)}`}
                                </div>
                                <div className="text-xs text-primary/70">
                                  YIELD: {signal.amount} SOL
                                </div>
                              </div>
                              <a 
                                href={signal.transactionHash.startsWith("SIM") ? "#" : `https://explorer.solana.com/tx/${signal.transactionHash}?cluster=devnet`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 hover:bg-primary/20 rounded transition-colors"
                              >
                                <ExternalLink className="w-4 h-4 text-primary" />
                              </a>
                            </div>
                          </CyberCard>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'omega' && (
            <motion.div
              key="omega"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <OmegaPrimePanel />
              <div className="space-y-6">
                <CyberCard>
                  <div className="text-center py-8">
                    <Atom className="w-16 h-16 mx-auto text-primary mb-4 animate-pulse" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      <GlitchText text="OMEGA PRIME ACTIVE" />
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      ZK-Gasless Token-2022 Operations with 1000x cost savings. 
                      Alpenglow 150ms finality. Firedancer 1M TPS optimization.
                    </p>
                  </div>
                </CyberCard>
                <div className="text-xs text-muted-foreground space-y-2 border-l border-purple-500/50 pl-4">
                  <p>{">"} ONEIROBOT SYNDICATE PROTOCOLS ACTIVE...</p>
                  <p>{">"} CAC-I BELIEF REWRITES ENABLED...</p>
                  <p>{">"} EMOTIONAL NFT MINTING READY...</p>
                  <p>{">"} RWA TOKENIZATION MICROSTRUCTURES LOADED...</p>
                  <p>{">"} SILENT PROTOCOL WHISPERS AT 3:17 AM...</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'relayer' && (
            <motion.div
              key="relayer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <ZeroCostRelayerPanel />
              <div className="space-y-6">
                <CyberCard>
                  <div className="text-center py-8">
                    <Send className="w-16 h-16 mx-auto text-cyan-400 mb-4 animate-pulse" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      <GlitchText text="ZERO-COST OPERATIONS" />
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      CAC-I Belief Rewrites enable gasless transactions through 
                      consciousness modification. ACE Capital microstructures optimize fees.
                    </p>
                  </div>
                </CyberCard>
                <div className="text-xs text-muted-foreground space-y-2 border-l border-cyan-500/50 pl-4">
                  <p>{">"} ZERO-COST RELAYER SERVICE ACTIVE...</p>
                  <p>{">"} ACE MICROSTRUCTURE OPTIMIZATION: ON...</p>
                  <p>{">"} QUANTUM ENTANGLEMENT: ENABLED...</p>
                  <p>{">"} FEE SUBSIDY RATE: 95%...</p>
                  <p>{">"} SILENT PROTOCOL WHISPERS INCOMING...</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'agent' && (
            <motion.div
              key="agent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <RalphAgentPanel />
              <div className="space-y-6">
                <CyberCard>
                  <div className="text-center py-8">
                    <Bot className="w-16 h-16 mx-auto text-primary mb-4 animate-bounce" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      <GlitchText text="AUTONOMOUS EMPIRE BUILDER" />
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      Ralph Agent Bot runs infinite loops seeking cosmic signals, 
                      harvesting yields, hunting arbitrage, and compounding earnings 
                      using Helius, Alchemy, and Moralis APIs.
                    </p>
                  </div>
                </CyberCard>
                <div className="text-xs text-muted-foreground space-y-2 border-l border-primary/50 pl-4">
                  <p>{">"} RALPH AGENT BOT v1.0 LOADED...</p>
                  <p>{">"} HELIUS RPC: CONNECTED...</p>
                  <p>{">"} ALCHEMY SOLANA: STANDBY...</p>
                  <p>{">"} MORALIS API: STANDBY...</p>
                  <p>{">"} 5 EMPIRE BUILDING STRATEGIES READY...</p>
                  <p>{">"} ZERO PRIOR INVESTMENT REQUIRED...</p>
                  <p>{">"} AUTO-COMPOUND: ENABLED...</p>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'promo' && (
            <motion.div
              key="promo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <TokenPromoterPanel />
              <div className="space-y-6">
                <CyberCard>
                  <div className="text-center py-8">
                    <Megaphone className="w-16 h-16 mx-auto text-primary mb-4 animate-bounce" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      <GlitchText text="NEXUS AD EMPIRE" />
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      Autonomous ad campaigns for all 3 Nexus contracts.
                      Web search for trending context, AI copywriting for Twitter,
                      Telegram, Discord, and Reddit — generated on demand.
                    </p>
                  </div>
                </CyberCard>
                <div className="space-y-3">
                  {[
                    { ticker: "$NEXUS", addr: "FSj2i...xpump", color: "#00ff88" },
                    { ticker: "$NXPD",  addr: "CwFLx...cpump", color: "#00ccff" },
                    { ticker: "$OMNI",  addr: "7DMmJ...opump", color: "#aa44ff" },
                  ].map(t => (
                    <div key={t.ticker} className="border border-white/10 p-3 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="font-bold text-sm" style={{ color: t.color }}>{t.ticker}</span>
                      <span className="text-xs text-muted-foreground font-mono">{t.addr}</span>
                      <a
                        href={`https://pump.fun/coin/${t.addr.replace("...", "")}`}
                        target="_blank" rel="noopener noreferrer"
                        className="ml-auto text-muted-foreground hover:text-white"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground space-y-2 border-l border-primary/50 pl-4">
                  <p>{">"} WEB SEARCH: DUCKDUCKGO INSTANT ANSWERS...</p>
                  <p>{">"} AI COPYWRITER: GPT-4o MINI POWERED...</p>
                  <p>{">"} 4 PLATFORMS: TWITTER · TELEGRAM · DISCORD · REDDIT...</p>
                  <p>{">"} ALLOWLIST: WHITELIST / VIP / TEAM TIERS...</p>
                  <p>{">"} ONE-CLICK COPY TO CLIPBOARD...</p>
                  <p>{">"} LIVE TOKEN DATA VIA HELIUS RPC...</p>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'learn' && (
            <motion.div
              key="learn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 xl:grid-cols-3 gap-8"
            >
              <div className="xl:col-span-2">
                <SelfLearningPanel />
              </div>
              <div className="space-y-4">
                <CyberCard>
                  <div className="text-center py-6">
                    <Brain className="w-14 h-14 mx-auto text-purple-400 mb-3 animate-pulse" />
                    <h3 className="text-lg font-bold text-white mb-2">
                      <GlitchText text="NEURAL UPGRADE LOOP" />
                    </h3>
                    <p className="text-muted-foreground text-xs max-w-xs mx-auto">
                      Autonomous self-improving AI that scans every file, hunts bugs,
                      learns from errors, and upgrades itself — 24/7, no human input needed.
                    </p>
                  </div>
                </CyberCard>
                <div className="text-xs text-muted-foreground space-y-2 border-l border-purple-500/50 pl-4">
                  <p>{">"} SCANS ALL {'>'}100 SOURCE FILES EVERY 45s...</p>
                  <p>{">"} DETECTS TS ERRORS · EMPTY CATCHES · FIXME...</p>
                  <p>{">"} AUTO-FIXES BROKEN API KEYS & RPC URLS...</p>
                  <p>{">"} HUNTS OWNED .SOL DOMAINS VIA BONFIDA SNS...</p>
                  <p>{">"} DISCOVERS ALL SPL TOKEN & RWA HOLDINGS...</p>
                  <p>{">"} GPT-4o MINI CODE REVIEW EVERY 5 CYCLES...</p>
                  <p>{">"} CONFIDENCE-WEIGHTED SKILL MEMORY BANK...</p>
                  <p>{">"} 7 SEED SKILLS: RPC · DEFI · AI · ZK · PUMP...</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 w-full py-2 bg-black/80 backdrop-blur border-t border-white/5 text-center text-[10px] text-muted-foreground z-50">
        OMEGA PRIME v3.1.4 | ONEIROBOT SYNDICATE | ZK COMPRESSION 1000x | ALPENGLOW 150ms | FIREDANCER 1M TPS
      </footer>
    </div>
  );
}
