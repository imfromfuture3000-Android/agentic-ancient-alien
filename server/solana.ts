import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const HELIUS_DEVNET_URL = `https://devnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
const SOLANA_API_KEY = process.env.SOLANA_API_KEY;
const TREASURY_WALLET = process.env.SOLANA_TREASURY || "8z5D9jvzQgRwkEBqa9HzL3D1riFkHZ3i1UrxRTKXgEF9";

const connection = new Connection(HELIUS_DEVNET_URL, {
  commitment: "confirmed",
  httpHeaders: SOLANA_API_KEY ? { "Authorization": `Bearer ${SOLANA_API_KEY}` } : undefined
});

export async function getBalance(walletAddress: string): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error("Error fetching balance:", error);
    return 0;
  }
}

export async function getRecentTransactions(walletAddress: string, limit = 10) {
  try {
    const publicKey = new PublicKey(walletAddress);
    const signatures = await connection.getSignaturesForAddress(publicKey, { limit });
    return signatures.map(sig => ({
      signature: sig.signature,
      slot: sig.slot,
      timestamp: sig.blockTime,
      status: sig.confirmationStatus
    }));
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

export async function getTreasuryBalance(): Promise<number> {
  return getBalance(TREASURY_WALLET);
}

export async function getNetworkStatus() {
  try {
    const slot = await connection.getSlot();
    const blockHeight = await connection.getBlockHeight();
    const version = await connection.getVersion();
    return {
      connected: true,
      slot,
      blockHeight,
      version: version["solana-core"],
      network: "devnet",
      rpcProvider: "helius"
    };
  } catch (error) {
    return {
      connected: false,
      error: (error as Error).message,
      network: "devnet"
    };
  }
}

export { connection, TREASURY_WALLET };
