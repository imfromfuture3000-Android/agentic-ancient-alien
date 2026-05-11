/**
 * Initialize the Agentic Futarchy protocol with the controller address.
 * This sets the single authority that controls all admin operations.
 * 
 * Usage: npx ts-node scripts/controller/initialize.ts
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
  // Load controller keypair
  const keypairPath = process.env.CONTROLLER_KEYPAIR || 
    path.join(process.env.HOME!, ".config/solana/controller.json");
  
  if (!fs.existsSync(keypairPath)) {
    console.error("❌ Controller keypair not found at:", keypairPath);
    console.log("Generate one with: solana-keygen new -o ~/.config/solana/controller.json");
    process.exit(1);
  }

  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const controller = Keypair.fromSecretKey(Uint8Array.from(keypairData));

  console.log("🔑 Controller Address:", controller.publicKey.toBase58());

  // Connect to devnet
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || clusterApiUrl("devnet"),
    "confirmed"
  );

  const balance = await connection.getBalance(controller.publicKey);
  console.log("💰 Controller Balance:", balance / 1e9, "SOL");

  if (balance < 0.1 * 1e9) {
    console.log("⚠️  Low balance. Requesting airdrop...");
    const sig = await connection.requestAirdrop(controller.publicKey, 2 * 1e9);
    await connection.confirmTransaction(sig);
    console.log("✅ Airdrop received: 2 SOL");
  }

  // Derive protocol state PDA
  const [protocolStatePDA, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("protocol_state")],
    PROGRAM_ID
  );

  console.log("📋 Protocol State PDA:", protocolStatePDA.toBase58());
  console.log("📋 PDA Bump:", bump);

  // Setup Anchor provider
  const wallet = new anchor.Wallet(controller);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  // Load IDL
  const idlPath = path.join(__dirname, "../../target/idl/agentic_futarchy.json");
  if (!fs.existsSync(idlPath)) {
    console.error("❌ IDL not found. Build the program first: anchor build");
    process.exit(1);
  }
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const program = new Program(idl, PROGRAM_ID, provider);

  // Initialize protocol
  console.log("\n🚀 Initializing protocol...");
  try {
    const tx = await program.methods
      .initialize()
      .accounts({
        protocolState: protocolStatePDA,
        controller: controller.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([controller])
      .rpc();

    console.log("✅ Protocol initialized!");
    console.log("📝 Transaction:", tx);
    console.log(`🔗 Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  } catch (err: any) {
    if (err.message?.includes("already in use")) {
      console.log("ℹ️  Protocol already initialized.");
    } else {
      throw err;
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: "devnet",
    programId: PROGRAM_ID.toBase58(),
    controllerAddress: controller.publicKey.toBase58(),
    protocolStatePDA: protocolStatePDA.toBase58(),
    pdaBump: bump,
    timestamp: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "../../deployment-info.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📄 Deployment info saved to:", outputPath);

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("Network:          devnet");
  console.log("Program ID:       ", PROGRAM_ID.toBase58());
  console.log("Controller:       ", controller.publicKey.toBase58());
  console.log("Protocol PDA:     ", protocolStatePDA.toBase58());
  console.log("========================\n");
}

main().catch(console.error);
