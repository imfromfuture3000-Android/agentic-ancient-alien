import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { getBalance, getTreasuryBalance, getNetworkStatus, getRecentTransactions, TREASURY_WALLET } from "./solana";
import { omegaPrime } from "./omega-prime";
import { zeroCostRelayer } from "./zero-cost-relayer";
import { ralphAgent } from "./ralph-agent";
import { selfLearningAgent } from "./self-learning-agent";
import {
  fetchAllTokenInfo,
  fetchTokenInfo,
  runAdCampaign,
  getCampaign,
  getAllCampaigns,
  webSearch,
  addToAllowlist,
  removeFromAllowlist,
  getAllowlist,
  isAllowlisted,
  NEXUS_TOKENS,
} from "./token-promoter";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.signals.list.path, async (req, res) => {
    const signals = await storage.getSignals();
    res.json(signals);
  });

  app.post(api.signals.create.path, async (req, res) => {
    try {
      const input = api.signals.create.input.parse(req.body);
      const signal = await storage.createSignal(input);
      res.status(201).json(signal);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get("/api/solana/status", async (req, res) => {
    try {
      const status = await getNetworkStatus();
      res.json(status);
    } catch (err) {
      res.status(500).json({ error: "Failed to get network status" });
    }
  });

  app.get("/api/solana/treasury", async (req, res) => {
    try {
      const balance = await getTreasuryBalance();
      res.json({ 
        wallet: TREASURY_WALLET,
        balance,
        network: "devnet"
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to get treasury balance" });
    }
  });

  app.get("/api/solana/balance/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const balance = await getBalance(address);
      res.json({ address, balance, network: "devnet" });
    } catch (err) {
      res.status(500).json({ error: "Failed to get wallet balance" });
    }
  });

  app.get("/api/solana/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const transactions = await getRecentTransactions(address, limit);
      res.json({ address, transactions, network: "devnet" });
    } catch (err) {
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  app.get("/api/omega/status", async (req, res) => {
    try {
      const [alpenglow, firedancer, security, rwa] = await Promise.all([
        omegaPrime.simulateAlpenglowConsensus(),
        omegaPrime.optimizeWithFiredancer(),
        omegaPrime.runOneiHackerSecurity(),
        omegaPrime.getRWATokenization()
      ]);
      
      res.json({
        whisper: omegaPrime.silentProtocolWhisper(),
        alpenglow,
        firedancer,
        security,
        rwa,
        emotions: omegaPrime.getEmotions()
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to get Omega Prime status" });
    }
  });

  app.post("/api/omega/mint-nft", async (req, res) => {
    try {
      const { emotion, walletAddress } = req.body;
      const metadata = await omegaPrime.mintEmotionalNFT(emotion, walletAddress);
      const zkResult = await omegaPrime.simulateZKCompression(1024);
      
      const nft = await storage.createEmotionalNft({
        walletAddress: walletAddress || "0xANONYMOUS",
        emotion: metadata.emotion,
        mintHash: metadata.quantumSignature,
        zkCompressed: true,
        metadata: metadata as unknown as Record<string, unknown>
      });

      res.status(201).json({
        nft,
        zkCompression: zkResult,
        whisper: omegaPrime.silentProtocolWhisper()
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to mint emotional NFT" });
    }
  });

  app.get("/api/omega/nfts", async (req, res) => {
    try {
      const nfts = await storage.getEmotionalNfts();
      res.json(nfts);
    } catch (err) {
      res.status(500).json({ error: "Failed to get emotional NFTs" });
    }
  });

  app.get("/api/omega/zk-compress", async (req, res) => {
    try {
      const size = parseInt(req.query.size as string) || 1024;
      const result = await omegaPrime.simulateZKCompression(size);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to simulate ZK compression" });
    }
  });

  app.post("/api/relayer/relay", async (req, res) => {
    try {
      const { from, to, amount, fee } = req.body;
      const result = await zeroCostRelayer.relayTransaction({ from, to, amount, fee });
      
      await storage.createRelayerTx({
        fromAddress: from,
        toAddress: to,
        originalFee: fee?.toString() || "0.000005",
        actualFee: result.actualFee.toString(),
        savings: result.savings.toString(),
        status: result.success ? "success" : "failed",
        txHash: result.txHash
      });

      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to relay transaction" });
    }
  });

  app.get("/api/relayer/stats", async (req, res) => {
    try {
      const stats = await zeroCostRelayer.getRelayerStats();
      const txs = await storage.getRelayerTxs();
      res.json({ ...stats, recentTransactions: txs.slice(0, 10) });
    } catch (err) {
      res.status(500).json({ error: "Failed to get relayer stats" });
    }
  });

  app.post("/api/relayer/estimate", async (req, res) => {
    try {
      const { from, to, amount, fee } = req.body;
      const estimate = await zeroCostRelayer.estimateRelay({ from, to, amount, fee });
      res.json(estimate);
    } catch (err) {
      res.status(500).json({ error: "Failed to estimate relay" });
    }
  });

  // Ralph Agent Bot Routes
  app.get("/api/agent/status", async (req, res) => {
    try {
      const status = ralphAgent.getStatus();
      res.json(status);
    } catch (err) {
      res.status(500).json({ error: "Failed to get agent status" });
    }
  });

  app.post("/api/agent/start", async (req, res) => {
    try {
      const result = await ralphAgent.start();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to start agent" });
    }
  });

  app.post("/api/agent/stop", async (req, res) => {
    try {
      const result = await ralphAgent.stop();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to stop agent" });
    }
  });

  app.post("/api/agent/strategy/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { enabled } = req.body;
      const success = ralphAgent.toggleStrategy(id, enabled);
      res.json({ success, strategyId: id, enabled });
    } catch (err) {
      res.status(500).json({ error: "Failed to toggle strategy" });
    }
  });

  app.post("/api/agent/network", async (req, res) => {
    try {
      const { network } = req.body;
      if (network !== "devnet" && network !== "mainnet") {
        return res.status(400).json({ error: "Invalid network. Use 'devnet' or 'mainnet'" });
      }
      const result = await ralphAgent.switchNetwork(network);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Failed to switch network" });
    }
  });

  // --- Token Promoter Routes ---
  app.get("/api/tokens", async (_req, res) => {
    try {
      const tokens = await fetchAllTokenInfo();
      res.json(tokens);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch token info" });
    }
  });

  app.get("/api/tokens/:id", async (req, res) => {
    try {
      const token = NEXUS_TOKENS.find(t => t.id === req.params.id);
      if (!token) return res.status(404).json({ error: "Token not found" });
      const info = await fetchTokenInfo(token);
      res.json(info);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch token info" });
    }
  });

  app.post("/api/tokens/:id/campaign", async (req, res) => {
    try {
      const campaign = await runAdCampaign(req.params.id);
      res.json(campaign);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get("/api/tokens/:id/campaign", async (req, res) => {
    const campaign = getCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ error: "No campaign yet. Run /campaign POST first." });
    res.json(campaign);
  });

  app.get("/api/campaigns", async (_req, res) => {
    res.json(getAllCampaigns());
  });

  app.post("/api/search", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) return res.status(400).json({ error: "query required" });
      const result = await webSearch(query);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  // --- Allowlist Routes ---
  app.get("/api/allowlist", (_req, res) => {
    res.json(getAllowlist());
  });

  app.post("/api/allowlist", (req, res) => {
    const { address, tier, notes } = req.body;
    if (!address || !tier) return res.status(400).json({ error: "address and tier required" });
    if (!["whitelist", "vip", "team"].includes(tier)) {
      return res.status(400).json({ error: "tier must be whitelist, vip, or team" });
    }
    const entry = addToAllowlist(address, tier, notes);
    res.status(201).json(entry);
  });

  app.delete("/api/allowlist/:address", (req, res) => {
    const removed = removeFromAllowlist(req.params.address);
    res.json({ removed, address: req.params.address });
  });

  app.get("/api/allowlist/:address", (req, res) => {
    const entry = isAllowlisted(req.params.address);
    if (!entry) return res.status(404).json({ allowed: false });
    res.json({ allowed: true, ...entry });
  });

  // ─── SELF-LEARNING AGENT ─────────────────────────────────────────────────

  app.get("/api/learn/status", (_req, res) => {
    res.json(selfLearningAgent.getState());
  });

  app.post("/api/learn/start", (_req, res) => {
    res.json(selfLearningAgent.start());
  });

  app.post("/api/learn/stop", (_req, res) => {
    res.json(selfLearningAgent.stop());
  });

  app.post("/api/learn/scan", async (_req, res) => {
    const result = await selfLearningAgent.triggerScan();
    res.json(result);
  });

  app.get("/api/learn/assets", async (_req, res) => {
    const assets = await selfLearningAgent.getOwnedAssets();
    res.json(assets);
  });

  // Auto-start self-learning agent on boot
  selfLearningAgent.start();

  return httpServer;
}
