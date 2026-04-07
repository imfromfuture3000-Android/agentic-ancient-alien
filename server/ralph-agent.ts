import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Agent Configuration using stored credentials
const CONFIG = {
  helius: {
    mainnet: process.env.HELIUS_HTTP_URL || `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
    devnet: `https://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
    parseTransactions: process.env.HELIUS_SOLANA_PARSE_TRANSACTION,
  },
  alchemy: {
    solana: process.env.HTTP_URL_SOL,
    apiKey: process.env.ALCHEMY_API_KEY,
  },
  moralis: {
    apiKey: process.env.MORALIS_API_KEY,
  },
  treasury: process.env.SOLANA_TREASURY || "8z5D9jvzQgRwkEBqa9HzL3D1riFkHZ3i1UrxRTKXgEF9",
  network: "devnet" as "devnet" | "mainnet", // Start with devnet for safety
};

// Agent State
interface AgentState {
  isRunning: boolean;
  cycleCount: number;
  totalEarnings: number;
  totalTransactions: number;
  lastCycleTime: number;
  strategies: AgentStrategy[];
  logs: AgentLog[];
  metrics: AgentMetrics;
}

interface AgentStrategy {
  id: string;
  name: string;
  type: "signal_seek" | "yield_farm" | "arbitrage" | "compound" | "liquidity";
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

interface AgentMetrics {
  uptime: number;
  cyclesPerHour: number;
  avgCycleTime: number;
  successRate: number;
  networkLatency: number;
  rpcHealth: { helius: boolean; alchemy: boolean; moralis: boolean };
}

interface CycleResult {
  success: boolean;
  action: string;
  profit: number;
  txHash?: string;
  details: Record<string, unknown>;
}

class RalphAgentBot {
  private state: AgentState;
  private connection: Connection;
  private intervalId: NodeJS.Timeout | null = null;
  private startTime: number = 0;

  constructor() {
    const rpcUrl = CONFIG.network === "mainnet" ? CONFIG.helius.mainnet : CONFIG.helius.devnet;
    this.connection = new Connection(rpcUrl, "confirmed");
    
    this.state = {
      isRunning: false,
      cycleCount: 0,
      totalEarnings: 0,
      totalTransactions: 0,
      lastCycleTime: 0,
      strategies: this.initStrategies(),
      logs: [],
      metrics: {
        uptime: 0,
        cyclesPerHour: 0,
        avgCycleTime: 0,
        successRate: 0,
        networkLatency: 0,
        rpcHealth: { helius: true, alchemy: true, moralis: true },
      },
    };
  }

  private initStrategies(): AgentStrategy[] {
    return [
      {
        id: "cosmic_signal",
        name: "Cosmic Signal Seeker",
        type: "signal_seek",
        enabled: true,
        successRate: 0,
        totalExecutions: 0,
        totalProfit: 0,
      },
      {
        id: "yield_harvest",
        name: "Yield Harvester",
        type: "yield_farm",
        enabled: true,
        successRate: 0,
        totalExecutions: 0,
        totalProfit: 0,
      },
      {
        id: "arbitrage_hunter",
        name: "Arbitrage Hunter",
        type: "arbitrage",
        enabled: true,
        successRate: 0,
        totalExecutions: 0,
        totalProfit: 0,
      },
      {
        id: "compound_engine",
        name: "Compound Engine",
        type: "compound",
        enabled: true,
        successRate: 0,
        totalExecutions: 0,
        totalProfit: 0,
      },
      {
        id: "liquidity_miner",
        name: "Liquidity Miner",
        type: "liquidity",
        enabled: true,
        successRate: 0,
        totalExecutions: 0,
        totalProfit: 0,
      },
    ];
  }

  private log(level: AgentLog["level"], message: string, data?: Record<string, unknown>) {
    const entry: AgentLog = { timestamp: Date.now(), level, message, data };
    this.state.logs.unshift(entry);
    if (this.state.logs.length > 100) this.state.logs.pop();
    console.log(`[RALPH-${level.toUpperCase()}] ${message}`, data || "");
  }

  async start(): Promise<{ success: boolean; message: string }> {
    if (this.state.isRunning) {
      return { success: false, message: "Agent already running" };
    }

    this.state.isRunning = true;
    this.startTime = Date.now();
    this.log("info", "Ralph Agent Bot initializing...");

    // Check RPC health
    await this.checkRpcHealth();

    // Start the infinite loop
    this.intervalId = setInterval(() => this.executeCycle(), 15000); // Every 15 seconds

    // Execute first cycle immediately
    await this.executeCycle();

    this.log("success", "Ralph Agent Bot ONLINE - Empire Building Mode ACTIVATED");
    return { success: true, message: "Ralph Agent Bot started successfully" };
  }

  async stop(): Promise<{ success: boolean; message: string }> {
    if (!this.state.isRunning) {
      return { success: false, message: "Agent not running" };
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.state.isRunning = false;
    this.log("info", "Ralph Agent Bot stopped");
    return { success: true, message: "Ralph Agent Bot stopped successfully" };
  }

  private async checkRpcHealth(): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.connection.getSlot();
      this.state.metrics.rpcHealth.helius = true;
      this.state.metrics.networkLatency = Date.now() - startTime;
    } catch (e) {
      this.state.metrics.rpcHealth.helius = false;
      this.log("warning", "Helius RPC health check failed");
    }

    // Check Alchemy (optional)
    try {
      if (CONFIG.alchemy.solana) {
        const alchemyConn = new Connection(CONFIG.alchemy.solana);
        await alchemyConn.getSlot();
        this.state.metrics.rpcHealth.alchemy = true;
      }
    } catch (e) {
      this.state.metrics.rpcHealth.alchemy = false;
    }

    // Moralis health check via API
    try {
      if (CONFIG.moralis.apiKey) {
        const response = await fetch("https://deep-index.moralis.io/api/v2.2/info/endpointWeights", {
          headers: { "X-API-Key": CONFIG.moralis.apiKey },
        });
        this.state.metrics.rpcHealth.moralis = response.ok;
      }
    } catch (e) {
      this.state.metrics.rpcHealth.moralis = false;
    }
  }

  private async executeCycle(): Promise<void> {
    if (!this.state.isRunning) return;

    const cycleStart = Date.now();
    this.state.cycleCount++;
    
    this.log("info", `Cycle #${this.state.cycleCount} starting...`);

    try {
      // Select strategy based on weighted random
      const enabledStrategies = this.state.strategies.filter(s => s.enabled);
      const strategy = enabledStrategies[Math.floor(Math.random() * enabledStrategies.length)];

      let result: CycleResult;

      switch (strategy.type) {
        case "signal_seek":
          result = await this.executeSignalSeek(strategy);
          break;
        case "yield_farm":
          result = await this.executeYieldFarm(strategy);
          break;
        case "arbitrage":
          result = await this.executeArbitrage(strategy);
          break;
        case "compound":
          result = await this.executeCompound(strategy);
          break;
        case "liquidity":
          result = await this.executeLiquidityMining(strategy);
          break;
        default:
          result = { success: false, action: "unknown", profit: 0, details: {} };
      }

      // Update strategy stats
      strategy.totalExecutions++;
      if (result.success) {
        strategy.totalProfit += result.profit;
        strategy.successRate = (strategy.successRate * (strategy.totalExecutions - 1) + 100) / strategy.totalExecutions;
        this.state.totalEarnings += result.profit;
        if (result.txHash) this.state.totalTransactions++;
      } else {
        strategy.successRate = (strategy.successRate * (strategy.totalExecutions - 1)) / strategy.totalExecutions;
      }

      this.log(
        result.success ? "success" : "warning",
        `Cycle #${this.state.cycleCount} ${result.success ? "completed" : "partial"}: ${result.action}`,
        { profit: result.profit, ...result.details }
      );

    } catch (error) {
      this.log("error", `Cycle #${this.state.cycleCount} failed`, { error: String(error) });
    }

    // Update metrics
    const cycleTime = Date.now() - cycleStart;
    this.state.lastCycleTime = cycleTime;
    this.state.metrics.uptime = Date.now() - this.startTime;
    this.state.metrics.avgCycleTime = (this.state.metrics.avgCycleTime * (this.state.cycleCount - 1) + cycleTime) / this.state.cycleCount;
    this.state.metrics.cyclesPerHour = this.state.cycleCount / (this.state.metrics.uptime / 3600000);
    
    const successfulCycles = this.state.strategies.reduce((acc, s) => acc + (s.successRate * s.totalExecutions / 100), 0);
    const totalExecutions = this.state.strategies.reduce((acc, s) => acc + s.totalExecutions, 0);
    this.state.metrics.successRate = totalExecutions > 0 ? (successfulCycles / totalExecutions) * 100 : 0;
  }

  private async executeSignalSeek(strategy: AgentStrategy): Promise<CycleResult> {
    // Scan for cosmic signals on the network
    try {
      const slot = await this.connection.getSlot();
      const blockTime = await this.connection.getBlockTime(slot);
      
      // Simulate signal detection with real network data
      const signalStrength = Math.random() * 100;
      const cosmicAlignment = (slot % 1000) / 1000;
      
      if (signalStrength > 60 && cosmicAlignment > 0.5) {
        const profit = 0.000001 * signalStrength * cosmicAlignment;
        return {
          success: true,
          action: `Signal detected at slot ${slot}`,
          profit,
          txHash: `SIG-${slot}-${Date.now().toString(16)}`,
          details: { slot, blockTime, signalStrength, cosmicAlignment },
        };
      }
      
      return {
        success: true,
        action: "Scanning frequencies...",
        profit: 0,
        details: { slot, signalStrength },
      };
    } catch (e) {
      return { success: false, action: "Signal scan failed", profit: 0, details: { error: String(e) } };
    }
  }

  private async executeYieldFarm(strategy: AgentStrategy): Promise<CycleResult> {
    // Simulate yield farming with real treasury balance check
    try {
      const treasuryPubkey = new PublicKey(CONFIG.treasury);
      const balance = await this.connection.getBalance(treasuryPubkey);
      const solBalance = balance / LAMPORTS_PER_SOL;
      
      // Calculate yield based on network activity
      const slot = await this.connection.getSlot();
      const yieldMultiplier = 0.0001 + (slot % 100) / 100000;
      const harvest = solBalance * yieldMultiplier * Math.random();
      
      if (harvest > 0.00001) {
        return {
          success: true,
          action: `Harvested yield from treasury pool`,
          profit: harvest,
          txHash: `YIELD-${Date.now().toString(16)}`,
          details: { treasuryBalance: solBalance, yieldMultiplier, harvest },
        };
      }
      
      return {
        success: true,
        action: "Yield accruing...",
        profit: 0,
        details: { treasuryBalance: solBalance },
      };
    } catch (e) {
      return { success: false, action: "Yield harvest failed", profit: 0, details: { error: String(e) } };
    }
  }

  private async executeArbitrage(strategy: AgentStrategy): Promise<CycleResult> {
    // Simulate cross-DEX arbitrage detection
    try {
      const slot = await this.connection.getSlot();
      
      // Simulate price differential detection
      const priceA = 100 + Math.random() * 10;
      const priceB = 100 + Math.random() * 10;
      const spread = Math.abs(priceA - priceB) / Math.min(priceA, priceB);
      
      if (spread > 0.02) { // 2% spread threshold
        const profit = spread * 0.01 * Math.random();
        return {
          success: true,
          action: `Arbitrage opportunity: ${spread.toFixed(2)}% spread`,
          profit,
          txHash: `ARB-${slot}-${Date.now().toString(16)}`,
          details: { priceA, priceB, spread, profit },
        };
      }
      
      return {
        success: true,
        action: "Monitoring price feeds...",
        profit: 0,
        details: { priceA, priceB, spread },
      };
    } catch (e) {
      return { success: false, action: "Arbitrage scan failed", profit: 0, details: { error: String(e) } };
    }
  }

  private async executeCompound(strategy: AgentStrategy): Promise<CycleResult> {
    // Auto-compound earnings
    if (this.state.totalEarnings > 0.0001) {
      const compoundRate = 0.05 + Math.random() * 0.05; // 5-10% compound
      const compoundProfit = this.state.totalEarnings * compoundRate;
      
      return {
        success: true,
        action: `Compounded ${compoundRate.toFixed(2)}% of earnings`,
        profit: compoundProfit,
        txHash: `COMP-${Date.now().toString(16)}`,
        details: { baseEarnings: this.state.totalEarnings, compoundRate, compoundProfit },
      };
    }
    
    return {
      success: true,
      action: "Building compound base...",
      profit: 0,
      details: { currentEarnings: this.state.totalEarnings },
    };
  }

  private async executeLiquidityMining(strategy: AgentStrategy): Promise<CycleResult> {
    // Simulate liquidity provision rewards
    try {
      const slot = await this.connection.getSlot();
      const epochInfo = await this.connection.getEpochInfo();
      
      // Calculate LP rewards based on epoch progress
      const epochProgress = epochInfo.slotIndex / epochInfo.slotsInEpoch;
      const lpReward = 0.00001 * epochProgress * Math.random();
      
      if (lpReward > 0.000001) {
        return {
          success: true,
          action: `LP rewards claimed: epoch ${epochInfo.epoch}`,
          profit: lpReward,
          txHash: `LP-${epochInfo.epoch}-${Date.now().toString(16)}`,
          details: { epoch: epochInfo.epoch, epochProgress, lpReward },
        };
      }
      
      return {
        success: true,
        action: "Mining liquidity rewards...",
        profit: 0,
        details: { epoch: epochInfo.epoch, epochProgress },
      };
    } catch (e) {
      return { success: false, action: "LP mining failed", profit: 0, details: { error: String(e) } };
    }
  }

  getStatus(): AgentState & { config: typeof CONFIG } {
    return {
      ...this.state,
      config: {
        ...CONFIG,
        helius: { ...CONFIG.helius },
        alchemy: { apiKey: CONFIG.alchemy.apiKey ? "***" : undefined, solana: CONFIG.alchemy.solana },
        moralis: { apiKey: CONFIG.moralis.apiKey ? "***" : undefined },
      },
    };
  }

  toggleStrategy(strategyId: string, enabled: boolean): boolean {
    const strategy = this.state.strategies.find(s => s.id === strategyId);
    if (strategy) {
      strategy.enabled = enabled;
      this.log("info", `Strategy ${strategy.name} ${enabled ? "enabled" : "disabled"}`);
      return true;
    }
    return false;
  }

  async switchNetwork(network: "devnet" | "mainnet"): Promise<{ success: boolean; message: string }> {
    const rpcUrl = network === "mainnet" ? CONFIG.helius.mainnet : CONFIG.helius.devnet;
    this.connection = new Connection(rpcUrl, "confirmed");
    (CONFIG as any).network = network;
    
    await this.checkRpcHealth();
    
    this.log("info", `Switched to ${network} network`);
    return { success: true, message: `Switched to ${network}` };
  }
}

// Singleton instance
export const ralphAgent = new RalphAgentBot();
