/**
 * Create a new prediction market. Controller only.
 * 
 * Usage: npx ts-node scripts/controller/create-market.ts \
 *   --name "Will SOL hit $500 by Q4 2026?" \
 *   --description "Binary prediction market for SOL price target" \
 *   --deadline 1735689600 \
 *   --outcome-a "YES" \
 *   --outcome-b "NO"
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
);

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace("--", "");
    parsed[key] = args[i + 1];
  }
  return parsed;
}

async function main() {
  const args = parseArgs();

  const marketName = args["name"] || "Default Market";
  const description = args["description"] || "A prediction market";
  const deadline = parseInt(args["deadline"] || String(Math.floor(Date.now() / 1000) + 86400 * 7));
  const outcomeA = args["outcome-a"] || "YES";
  const outcomeB = args["outcome-b"] || "NO";
  const oracleSource = args["oracle"] || "ai-agent";

  // Load controller keypair
  const keypairPath = process.env.CONTROLLER_KEYPAIR || 
    path.join(process.env.HOME!, ".config/solana/controller.json");
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const controller = Keypair.fromSecretKey(Uint8Array.from(keypairData));

  console.log("🔑 Controller:", controller.publicKey.toBase58());
  console.log("📊 Creating market:", marketName);

  const connection = new Connection(
    process.env.SOLANA_RPC_URL || clusterApiUrl("devnet"),
    "confirmed"
  );

  // Derive PDAs
  const [protocolStatePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("protocol_state")],
    PROGRAM_ID
  );

  // Get current market count to derive next market PDA
  const wallet = new anchor.Wallet(controller);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const idlPath = path.join(__dirname, "../../target/idl/agentic_futarchy.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const program = new Program(idl, PROGRAM_ID, provider);

  const stateAccount = await program.account.protocolState.fetch(protocolStatePDA);
  const marketCount = (stateAccount as any).marketCount.toNumber();

  const [marketPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("market"), Buffer.from(new anchor.BN(marketCount).toArray("le", 8))],
    PROGRAM_ID
  );

  console.log("📋 Market PDA:", marketPDA.toBase58());
  console.log("📋 Market ID:", marketCount);

  // Create market
  const tx = await program.methods
    .createMarket(marketName, description, new anchor.BN(deadline), outcomeA, outcomeB, oracleSource)
    .accounts({
      protocolState: protocolStatePDA,
      market: marketPDA,
      controller: controller.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([controller])
    .rpc();

  console.log("\n✅ Market created!");
  console.log("📝 Transaction:", tx);
  console.log(`🔗 Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  console.log("\n=== MARKET DETAILS ===");
  console.log("Market ID:    ", marketCount);
  console.log("Market PDA:   ", marketPDA.toBase58());
  console.log("Name:         ", marketName);
  console.log("Deadline:     ", new Date(deadline * 1000).toISOString());
  console.log("Outcomes:     ", outcomeA, "vs", outcomeB);
  console.log("Oracle:       ", oracleSource);
  console.log("====================\n");
}

main().catch(console.error);
