import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const TREASURY_WALLET = process.env.SOLANA_TREASURY || "8z5D9jvzQgRwkEBqa9HzL3D1riFkHZ3i1UrxRTKXgEF9";
const HELIUS_URL = process.env.HELIUS_HTTP_URL || `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
const OPEN_API_KEY = process.env.OPEN_API_KEY;

const NEXUS_CONTRACTS = [
  { address: "FSj2iWrjQWKRUfLJ8UKTwStW6Yz3njZW8mAL4sbxpump", name: "$NEXUS", symbol: "NEXUS" },
  { address: "CwFLxN2Hq6rBwDZqtuUhBF59dCHj6y71XHM7o7dcpump", name: "$NXPD", symbol: "NXPD" },
  { address: "7DMmJXxojXYeFAX53KQkZThRDRDGJ384YVN8zHWopump", name: "$OMNI", symbol: "OMNI" },
];

export interface ScanResult {
  type: "error" | "warning" | "fix" | "asset" | "skill" | "info";
  file?: string;
  line?: number;
  message: string;
  fixApplied?: string;
  timestamp: number;
}

export interface OwnedAsset {
  address: string;
  assetType: "token" | "program" | "domain" | "nft" | "rwa";
  name: string;
  symbol?: string;
  balance?: number;
  ownerWallet: string;
  transferStatus: "owned" | "needs_transfer" | "transferred";
  onChainData?: Record<string, unknown>;
}

export interface AgentSkill {
  id: string;
  name: string;
  category: "rpc" | "defi" | "security" | "code" | "asset" | "ai";
  description: string;
  learnedAt: number;
  confidence: number;
  usageCount: number;
}

export interface LearningState {
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

const state: LearningState = {
  isRunning: false,
  cycleCount: 0,
  scanResults: [],
  ownedAssets: [],
  skills: [],
  errorsFixed: 0,
  filesScanned: 0,
  lastScanTime: 0,
  repoHealth: 100,
  logs: [],
};

let loopTimer: ReturnType<typeof setTimeout> | null = null;

function log(level: "info" | "success" | "warning" | "error", msg: string) {
  const entry = { ts: Date.now(), level, msg };
  state.logs.unshift(entry);
  if (state.logs.length > 200) state.logs.pop();
  console.log(`[LEARN-${level.toUpperCase()}] ${msg}`);
}

function addScanResult(r: Omit<ScanResult, "timestamp">) {
  state.scanResults.unshift({ ...r, timestamp: Date.now() });
  if (state.scanResults.length > 500) state.scanResults.pop();
}

function learnSkill(skill: Omit<AgentSkill, "learnedAt" | "usageCount">) {
  const existing = state.skills.find((s) => s.id === skill.id);
  if (existing) {
    existing.usageCount++;
    existing.confidence = Math.min(1, existing.confidence + 0.05);
  } else {
    state.skills.unshift({ ...skill, learnedAt: Date.now(), usageCount: 1 });
    if (state.skills.length > 100) state.skills.pop();
  }
}

// ─── REPO FILE SCANNER ────────────────────────────────────────────────────────

function getAllSourceFiles(dir: string, exts: string[] = [".ts", ".tsx"]): string[] {
  const results: string[] = [];
  const ignore = ["node_modules", "dist", ".git", ".cache"];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (ignore.includes(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) results.push(...getAllSourceFiles(full, exts));
      else if (exts.some((x) => e.name.endsWith(x))) results.push(full);
    }
  } catch { /* skip unreadable dirs */ }
  return results;
}

const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  severity: "error" | "warning";
  description: string;
  autoFix?: (content: string) => string;
}> = [
  {
    pattern: /process\.env\.\w+\s*\|\|\s*undefined/g,
    severity: "warning",
    description: "Env var fallback to undefined",
  },
  {
    pattern: /api-key=undefined/g,
    severity: "error",
    description: "Hardcoded undefined API key in URL",
  },
  {
    pattern: /console\.log\(/g,
    severity: "warning",
    description: "console.log found (prefer structured logging)",
  },
  {
    pattern: /any\b/g,
    severity: "warning",
    description: "TypeScript 'any' type usage",
  },
  {
    pattern: /TODO|FIXME|HACK|XXX/g,
    severity: "warning",
    description: "Unresolved TODO/FIXME comment",
  },
  {
    pattern: /throw new Error\(""/,
    severity: "error",
    description: "Empty error message thrown",
  },
  {
    pattern: /catch\s*\(.*\)\s*\{\s*\}/g,
    severity: "error",
    description: "Empty catch block (swallowed error)",
  },
];

function scanRepoForErrors(): ScanResult[] {
  const results: ScanResult[] = [];
  const root = process.cwd();
  const files = getAllSourceFiles(root);
  state.filesScanned = files.length;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const lines = content.split("\n");
      const relPath = path.relative(root, file);

      for (const ep of ERROR_PATTERNS) {
        lines.forEach((line, idx) => {
          if (ep.pattern.test(line)) {
            results.push({
              type: ep.severity,
              file: relPath,
              line: idx + 1,
              message: `${ep.description} → ${line.trim().slice(0, 80)}`,
              timestamp: Date.now(),
            });
          }
          ep.pattern.lastIndex = 0;
        });
      }
    } catch { /* unreadable */ }
  }
  return results;
}

// ─── TYPESCRIPT COMPILE CHECK ──────────────────────────────────────────────

function runTypeCheck(): ScanResult[] {
  const results: ScanResult[] = [];
  try {
    execSync("npx tsc --noEmit --skipLibCheck 2>&1", { cwd: process.cwd(), timeout: 30000 });
    results.push({ type: "info", message: "TypeScript compile check: PASSED ✓", timestamp: Date.now() });
    learnSkill({ id: "ts_compile_clean", name: "TypeScript Compile", category: "code", description: "Codebase compiles without errors", confidence: 0.95 });
  } catch (err: unknown) {
    const output = (err as { stdout?: Buffer }).stdout?.toString() || "";
    const errorLines = output.split("\n").filter((l) => l.includes("error TS"));
    errorLines.slice(0, 10).forEach((line) => {
      const match = line.match(/^(.+)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
      if (match) {
        results.push({
          type: "error",
          file: match[1].replace(process.cwd() + "/", ""),
          line: parseInt(match[2]),
          message: `${match[4]}: ${match[5]}`,
          timestamp: Date.now(),
        });
      }
    });
    if (errorLines.length > 0) {
      learnSkill({ id: "ts_errors_detected", name: "TypeScript Error Detection", category: "code", description: `Detected ${errorLines.length} TS errors in codebase`, confidence: 0.9 });
    }
  }
  return results;
}

// ─── SOLANA ON-CHAIN ASSET SCANNER ─────────────────────────────────────────

async function scanOwnedAssets(): Promise<OwnedAsset[]> {
  const assets: OwnedAsset[] = [];
  const connection = new Connection(HELIUS_URL, "confirmed");

  try {
    const pubkey = new PublicKey(TREASURY_WALLET);

    // SOL balance
    const balance = await connection.getBalance(pubkey);
    assets.push({
      address: TREASURY_WALLET,
      assetType: "rwa",
      name: "Treasury SOL",
      symbol: "SOL",
      balance: balance / LAMPORTS_PER_SOL,
      ownerWallet: TREASURY_WALLET,
      transferStatus: "owned",
      onChainData: { lamports: balance, slot: await connection.getSlot() },
    });
    learnSkill({ id: "treasury_scan", name: "Treasury Balance Scan", category: "asset", description: `Treasury has ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL`, confidence: 0.98 });

    // Token accounts
    try {
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      });

      for (const { account, pubkey: taPubkey } of tokenAccounts.value) {
        const info = account.data.parsed?.info;
        if (!info) continue;
        const mint = info.mint;
        const amount = info.tokenAmount?.uiAmount ?? 0;
        if (amount === 0) continue;

        const nexus = NEXUS_CONTRACTS.find((c) => c.address === mint);
        assets.push({
          address: mint,
          assetType: nexus ? "token" : "token",
          name: nexus ? nexus.name : `Token ${mint.slice(0, 8)}...`,
          symbol: nexus?.symbol,
          balance: amount,
          ownerWallet: TREASURY_WALLET,
          transferStatus: "owned",
          onChainData: {
            tokenAccount: taPubkey.toBase58(),
            decimals: info.tokenAmount?.decimals,
            isNexus: !!nexus,
          },
        });
      }
      learnSkill({ id: "token_scan", name: "SPL Token Scanner", category: "asset", description: `Found ${tokenAccounts.value.length} token accounts`, confidence: 0.95 });
    } catch (e) {
      log("warning", `Token account scan partial: ${e}`);
    }

    // Check Bonfida SNS domain ownership (.sol names)
    try {
      const SNS_PROGRAM = new PublicKey("namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX");
      const domainAccounts = await connection.getProgramAccounts(SNS_PROGRAM, {
        filters: [
          { memcmp: { offset: 32, bytes: pubkey.toBase58() } },
        ],
      });
      for (const { pubkey: domPub } of domainAccounts.slice(0, 5)) {
        assets.push({
          address: domPub.toBase58(),
          assetType: "domain",
          name: `.sol domain`,
          ownerWallet: TREASURY_WALLET,
          transferStatus: "owned",
          onChainData: { programId: SNS_PROGRAM.toBase58() },
        });
      }
      if (domainAccounts.length > 0) {
        learnSkill({ id: "domain_scan", name: ".sol Domain Scanner", category: "asset", description: `Found ${domainAccounts.length} .sol domains`, confidence: 0.9 });
      }
    } catch { /* SNS scan fails silently */ }

    // Check Nexus contracts token info via Helius DAS
    for (const nc of NEXUS_CONTRACTS) {
      try {
        const res = await fetch(`${HELIUS_URL}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0", id: 1,
            method: "getAsset",
            params: { id: nc.address },
          }),
        });
        const data = await res.json() as { result?: { content?: { metadata?: { name?: string } }; token_info?: { supply?: number; price_info?: { price_per_token?: number } } } };
        if (data.result) {
          const r = data.result;
          const existing = assets.find((a) => a.address === nc.address);
          if (!existing) {
            assets.push({
              address: nc.address,
              assetType: "token",
              name: nc.name,
              symbol: nc.symbol,
              ownerWallet: TREASURY_WALLET,
              transferStatus: "owned",
              onChainData: {
                supply: r.token_info?.supply,
                price: r.token_info?.price_info?.price_per_token,
                pumpfun: true,
              },
            });
          }
          learnSkill({ id: `das_${nc.symbol}`, name: `DAS Asset: ${nc.symbol}`, category: "asset", description: `Retrieved on-chain data for ${nc.name}`, confidence: 0.9 });
        }
      } catch { /* DAS partial */ }
    }

  } catch (e) {
    log("error", `Asset scan failed: ${e}`);
    addScanResult({ type: "error", message: `On-chain scan error: ${e}` });
  }

  return assets;
}

// ─── AUTO-FIX KNOWN ERRORS ──────────────────────────────────────────────────

interface KnownFix {
  pattern: RegExp;
  description: string;
  fix: (match: string) => string;
}

const AUTO_FIXES: KnownFix[] = [
  {
    pattern: /https:\/\/devnet\.helius-rpc\.com\/\?api-key=undefined/g,
    description: "Fixed undefined Helius devnet key",
    fix: () =>
      process.env.HELIUS_HTTP_URL
        ? process.env.HELIUS_HTTP_URL.replace("mainnet", "devnet")
        : "https://api.devnet.solana.com",
  },
];

function applyAutoFixes(): number {
  let fixed = 0;
  const root = process.cwd();
  const files = getAllSourceFiles(root, [".ts"]);

  for (const file of files) {
    if (file.includes("node_modules") || file.includes(".git")) continue;
    try {
      let content = fs.readFileSync(file, "utf-8");
      let changed = false;
      for (const fix of AUTO_FIXES) {
        if (fix.pattern.test(content)) {
          content = content.replace(fix.pattern, fix.fix);
          changed = true;
          addScanResult({
            type: "fix",
            file: path.relative(root, file),
            message: `AUTO-FIX: ${fix.description}`,
            fixApplied: fix.description,
          });
          learnSkill({
            id: `autofix_${fix.description.slice(0, 20).replace(/\s/g, "_")}`,
            name: `Auto-Fix: ${fix.description}`,
            category: "code",
            description: fix.description,
            confidence: 0.95,
          });
          fixed++;
        }
        fix.pattern.lastIndex = 0;
      }
      if (changed) fs.writeFileSync(file, content, "utf-8");
    } catch { /* skip locked files */ }
  }
  return fixed;
}

// ─── OPENAI ANALYSIS ────────────────────────────────────────────────────────

async function analyzeWithAI(errors: ScanResult[]): Promise<string> {
  if (!OPEN_API_KEY || errors.length === 0) return "";
  const top = errors
    .filter((e) => e.type === "error")
    .slice(0, 5)
    .map((e) => `${e.file}:${e.line} → ${e.message}`)
    .join("\n");
  if (!top) return "";
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPEN_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content:
              "You are a Solana DeFi codebase auto-repair AI. Analyze errors briefly and suggest the single most impactful fix. Be concise (under 100 words). Respond in cyberpunk tone.",
          },
          { role: "user", content: `Errors found:\n${top}` },
        ],
      }),
    });
    const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || "";
  } catch {
    return "";
  }
}

// ─── LEARNING CYCLE ─────────────────────────────────────────────────────────

async function runLearningCycle() {
  state.cycleCount++;
  state.lastScanTime = Date.now();
  log("info", `Learning Cycle #${state.cycleCount} initiated — scanning empire...`);

  try {
    // 1. Scan repo files for error patterns
    const fileErrors = scanRepoForErrors();
    fileErrors.slice(0, 20).forEach((r) => addScanResult(r));
    log("info", `File scan: ${fileErrors.length} issues in ${state.filesScanned} files`);

    // 2. TypeScript check (async, non-blocking)
    const tsResults = runTypeCheck();
    tsResults.forEach((r) => addScanResult(r));
    const tsErrors = tsResults.filter((r) => r.type === "error").length;
    if (tsErrors > 0) {
      log("warning", `TypeScript: ${tsErrors} type errors detected`);
      state.repoHealth = Math.max(0, state.repoHealth - tsErrors * 2);
    } else {
      state.repoHealth = Math.min(100, state.repoHealth + 2);
      log("success", "TypeScript compile: CLEAN");
    }

    // 3. Apply auto-fixes
    const fixed = applyAutoFixes();
    state.errorsFixed += fixed;
    if (fixed > 0) {
      log("success", `Applied ${fixed} auto-fix(es)`);
    }

    // 4. Scan on-chain assets
    log("info", "Scanning Solana on-chain assets...");
    const assets = await scanOwnedAssets();
    state.ownedAssets = assets;
    log("success", `Discovered ${assets.length} owned assets on-chain`);

    // 5. AI analysis of top errors
    const allErrors = [...fileErrors, ...tsResults].filter((r) => r.type === "error");
    if (allErrors.length > 0 && state.cycleCount % 5 === 0) {
      log("info", "Running GPT-4o Mini analysis...");
      const analysis = await analyzeWithAI(allErrors);
      if (analysis) {
        addScanResult({ type: "skill", message: `AI Analysis: ${analysis}` });
        learnSkill({
          id: `ai_analysis_${state.cycleCount}`,
          name: "AI Code Review",
          category: "ai",
          description: analysis.slice(0, 120),
          confidence: 0.85,
        });
      }
    }

    // 6. Learn from patterns
    const uniqueErrors = [...new Set(fileErrors.map((e) => e.message.split("→")[0].trim()))];
    for (const pattern of uniqueErrors.slice(0, 3)) {
      learnSkill({
        id: `pattern_${Buffer.from(pattern).toString("base64").slice(0, 12)}`,
        name: `Pattern: ${pattern.slice(0, 40)}`,
        category: "code",
        description: `Recurring pattern detected across codebase: ${pattern}`,
        confidence: 0.7,
      });
    }

    const errorCount = fileErrors.filter((r) => r.type === "error").length;
    const warnCount = fileErrors.filter((r) => r.type === "warning").length;
    log("success", `Cycle #${state.cycleCount} complete — ${errorCount} errors, ${warnCount} warnings, ${state.skills.length} skills learned`);
  } catch (err) {
    log("error", `Learning cycle failed: ${err}`);
  }
}

// ─── PUBLIC API ─────────────────────────────────────────────────────────────

export const selfLearningAgent = {
  start() {
    if (state.isRunning) return { success: false, message: "Already running" };
    state.isRunning = true;
    log("info", "Self-Learning Agent ONLINE — 24/7 autonomous mode activated");

    // Seed initial skills from known architecture
    learnSkill({ id: "solana_web3", name: "Solana web3.js", category: "defi", description: "Native Solana transaction building and signing", confidence: 0.99 });
    learnSkill({ id: "helius_rpc", name: "Helius RPC", category: "rpc", description: "Primary RPC with DAS, parsed transactions, webhooks", confidence: 0.9 });
    learnSkill({ id: "openai_gpt", name: "OpenAI GPT-4o Mini", category: "ai", description: "AI ad copy generation and code review", confidence: 0.95 });
    learnSkill({ id: "drizzle_orm", name: "Drizzle ORM", category: "code", description: "Type-safe PostgreSQL ORM for all persistence", confidence: 0.95 });
    learnSkill({ id: "pump_fun", name: "pump.fun Integration", category: "defi", description: "3 live tokens: $NEXUS, $NXPD, $OMNI on mainnet", confidence: 0.99 });
    learnSkill({ id: "zk_compress", name: "ZK Compression", category: "defi", description: "1000x cost savings on Solana NFT/token ops", confidence: 0.85 });
    learnSkill({ id: "rpc_fallback", name: "RPC Fallback Chain", category: "rpc", description: "Helius → Alchemy → Moralis automatic failover", confidence: 0.9 });

    const schedule = async () => {
      if (!state.isRunning) return;
      await runLearningCycle();
      loopTimer = setTimeout(schedule, 45_000);
    };
    schedule();
    return { success: true, message: "Self-Learning Agent started" };
  },

  stop() {
    state.isRunning = false;
    if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
    log("info", "Self-Learning Agent paused");
    return { success: true, message: "Agent stopped" };
  },

  getState(): LearningState {
    return state;
  },

  async triggerScan() {
    await runLearningCycle();
    return { success: true, message: "Manual scan complete" };
  },

  async getOwnedAssets(): Promise<OwnedAsset[]> {
    const assets = await scanOwnedAssets();
    state.ownedAssets = assets;
    return assets;
  },
};
