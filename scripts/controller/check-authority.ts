/**
 * Check current controller/authority status and all PDAs.
 * Read-only — anyone can run this.
 * 
 * Usage: npx ts-node scripts/controller/check-authority.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";

const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
);

async function main() {
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || clusterApiUrl("devnet"),
    "confirmed"
  );

  console.log("🔍 PROTOCOL AUTHORITY CHECK");
  console.log("═══════════════════════════════════════════════════════\n");
  console.log("Program ID:", PROGRAM_ID.toBase58());
  console.log("Network:   ", process.env.SOLANA_RPC_URL || "devnet");
  console.log("");

  // Derive protocol state PDA
  const [protocolStatePDA, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("protocol_state")],
    PROGRAM_ID
  );

  console.log("📋 Protocol State PDA:", protocolStatePDA.toBase58());
  console.log("   PDA Bump:", bump);

  // Check if protocol is initialized
  const accountInfo = await connection.getAccountInfo(protocolStatePDA);
  if (!accountInfo) {
    console.log("\n❌ Protocol NOT initialized. Run initialize.ts first.");
    return;
  }

  // Load IDL and fetch state
  const idlPath = path.join(__dirname, "../../target/idl/agentic_futarchy.json");
  if (fs.existsSync(idlPath)) {
    const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
    const wallet = anchor.Wallet.local();
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
    const program = new Program(idl, PROGRAM_ID, provider);

    try {
      const state = await program.account.protocolState.fetch(protocolStatePDA) as any;

      console.log("\n✅ Protocol is INITIALIZED");
      console.log("═══════════════════════════════════════════════════════");
      console.log("🔑 Controller:     ", state.controller.toBase58());
      console.log("📊 Market Count:   ", state.marketCount.toString());
      console.log("💰 Total Volume:   ", state.totalVolume.toString(), "lamports");
      console.log("💸 Protocol Fee:   ", state.protocolFeeBps.toString(), "bps (" + (state.protocolFeeBps / 100) + "%)");
      console.log("⏸️  Paused:         ", state.isPaused ? "YES ⚠️" : "NO ✅");
      console.log("═══════════════════════════════════════════════════════\n");

      // List all market PDAs
      if (state.marketCount > 0) {
        console.log("📊 MARKETS:");
        console.log("───────────────────────────────────────────────────────");
        for (let i = 0; i < Math.min(state.marketCount, 20); i++) {
          const [marketPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("market"), Buffer.from(new anchor.BN(i).toArray("le", 8))],
            PROGRAM_ID
          );
          console.log(`  Market ${i}: ${marketPDA.toBase58()}`);

          try {
            const market = await program.account.market.fetch(marketPDA) as any;
            console.log(`    Name: ${market.marketName}`);
            console.log(`    Resolved: ${market.resolved}`);
            console.log(`    Total Funds: ${market.totalFunds.toString()}`);
            console.log(`    Authority: ${market.controllerAuthority.toBase58()}`);
          } catch {
            console.log(`    (unable to fetch)`);
          }
        }
      }

      // Check controller balance
      const balance = await connection.getBalance(state.controller);
      console.log("\n💰 Controller SOL Balance:", balance / 1e9, "SOL");

      // Program account info
      const programInfo = await connection.getAccountInfo(PROGRAM_ID);
      if (programInfo) {
        console.log("\n🏗️  PROGRAM INFO:");
        console.log("   Executable:", programInfo.executable);
        console.log("   Owner:", programInfo.owner.toBase58());
        console.log("   Data Length:", programInfo.data.length, "bytes");
      }

    } catch (err) {
      console.log("\n⚠️  Could not decode protocol state. IDL may be outdated.");
      console.log("   Raw data length:", accountInfo.data.length);
    }
  } else {
    console.log("\n⚠️  IDL not found. Showing raw account info:");
    console.log("   Owner:", accountInfo.owner.toBase58());
    console.log("   Data Length:", accountInfo.data.length);
    console.log("   Lamports:", accountInfo.lamports);
  }
}

main().catch(console.error);
