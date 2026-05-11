/**
 * Transfer controller authority to a new address. Current controller only.
 * ⚠️  WARNING: This is irreversible. The new address will have full control.
 * 
 * Usage: npx ts-node scripts/controller/transfer-authority.ts --new-controller <PUBKEY>
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const PROGRAM_ID = new PublicKey(
  process.env.PROGRAM_ID || "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"
);

function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "yes");
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  let newControllerStr = "";

  for (let i = 0; i < args.length; i += 2) {
    if (args[i] === "--new-controller") newControllerStr = args[i + 1];
  }

  if (!newControllerStr) {
    console.error("❌ Usage: --new-controller <PUBKEY>");
    process.exit(1);
  }

  const newController = new PublicKey(newControllerStr);

  const keypairPath = process.env.CONTROLLER_KEYPAIR || 
    path.join(process.env.HOME!, ".config/solana/controller.json");
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const controller = Keypair.fromSecretKey(Uint8Array.from(keypairData));

  console.log("⚠️  AUTHORITY TRANSFER");
  console.log("═══════════════════════════════════════");
  console.log("Current Controller:", controller.publicKey.toBase58());
  console.log("New Controller:    ", newController.toBase58());
  console.log("═══════════════════════════════════════");
  console.log("\n⚠️  This action is IRREVERSIBLE.");
  console.log("The new address will have FULL control over:");
  console.log("  - Creating markets");
  console.log("  - Resolving markets");
  console.log("  - Withdrawing fees");
  console.log("  - Pausing the protocol");
  console.log("  - Further authority transfers\n");

  const confirmed = await askConfirmation("Type 'yes' to confirm transfer: ");
  if (!confirmed) {
    console.log("❌ Transfer cancelled.");
    process.exit(0);
  }

  const connection = new Connection(
    process.env.SOLANA_RPC_URL || clusterApiUrl("devnet"),
    "confirmed"
  );

  const [protocolStatePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("protocol_state")],
    PROGRAM_ID
  );

  const wallet = new anchor.Wallet(controller);
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  const idlPath = path.join(__dirname, "../../target/idl/agentic_futarchy.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const program = new Program(idl, PROGRAM_ID, provider);

  const tx = await program.methods
    .transferAuthority(newController)
    .accounts({
      protocolState: protocolStatePDA,
      controller: controller.publicKey,
    })
    .signers([controller])
    .rpc();

  console.log("\n✅ Authority transferred successfully!");
  console.log("📝 Transaction:", tx);
  console.log(`🔗 Explorer: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  console.log("\n🔒 Old controller no longer has access.");
  console.log("🔑 New controller:", newController.toBase58());
}

main().catch(console.error);
