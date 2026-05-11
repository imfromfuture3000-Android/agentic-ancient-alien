/**
 * Resolve a prediction market. Controller only.
 * 
 * Usage: npx ts-node scripts/controller/resolve-market.ts --market-id 0 --outcome 0
 *   --outcome 0 = Outcome A wins
 *   --outcome 1 = Outcome B wins
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
);

async function main() {
  const args = process.argv.slice(2);
  let marketId = 0;
  let outcome = 0;

  for (let i = 0; i < args.length; i += 2) {
    if (args[i] === "--market-id") marketId = parseInt(args[i + 1]);
    if (args[i] === "--outcome") outcome = parseInt(args[i + 1]);
  }

  const keypairPath = process.env.CONTROLLER_KEYPAIR || 
    path.join(process.env.HOME!, ".config/solana/controller.json");
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const controller = Keypair.fromSecretKey(Uint8Array.from(keypairData));

  console.log("🔑 Controller:", controller.publicKey.toBase58());
  console.log("📊 Resolving market:", marketId, "with outcome:", outcome);

  const connection = new Connection(
    process.env.SOLANA_RPC_URL || clusterApiUrl("devnet"),
    "confirmed"
  );

  const [protocolStatePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("protocol_state")],
    PROGRAM_ID
  );

  const [marketPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("market"), Buffer.from(new anchor.BN(marketId).toArray("le", 8))],
    PROGRAM_ID
  );

  const wallet = new anchor.Wallet(controller);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const idlPath = path.join(__dirname, "../../target/idl/agentic_futarchy.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const program = new Program(idl, PROGRAM_ID, provider);

  const tx = await program.methods
    .resolveMarket(outcome)
    .accounts({
      protocolState: protocolStatePDA,
      market: marketPDA,
      controller: controller.publicKey,
    })
    .signers([controller])
    .rpc();

  console.log("\n✅ Market resolved!");
  console.log("📝 Transaction:", tx);
  console.log(`🔗 Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
}

main().catch(console.error);
