import { 
  alien_signals, emotional_nfts, relayer_transactions,
  type InsertAlienSignal, type AlienSignal,
  type InsertEmotionalNft, type EmotionalNft,
  type InsertRelayerTx, type RelayerTransaction
} from "@shared/schema";
import { db } from "./db";
import { desc } from "drizzle-orm";

export interface IStorage {
  createSignal(signal: InsertAlienSignal): Promise<AlienSignal>;
  getSignals(): Promise<AlienSignal[]>;
  createEmotionalNft(nft: InsertEmotionalNft): Promise<EmotionalNft>;
  getEmotionalNfts(): Promise<EmotionalNft[]>;
  createRelayerTx(tx: InsertRelayerTx): Promise<RelayerTransaction>;
  getRelayerTxs(): Promise<RelayerTransaction[]>;
}

export class DatabaseStorage implements IStorage {
  async createSignal(insertSignal: InsertAlienSignal): Promise<AlienSignal> {
    const [signal] = await db
      .insert(alien_signals)
      .values(insertSignal)
      .returning();
    return signal;
  }

  async getSignals(): Promise<AlienSignal[]> {
    return await db
      .select()
      .from(alien_signals)
      .orderBy(desc(alien_signals.id))
      .limit(50);
  }

  async createEmotionalNft(insertNft: InsertEmotionalNft): Promise<EmotionalNft> {
    const [nft] = await db
      .insert(emotional_nfts)
      .values(insertNft)
      .returning();
    return nft;
  }

  async getEmotionalNfts(): Promise<EmotionalNft[]> {
    return await db
      .select()
      .from(emotional_nfts)
      .orderBy(desc(emotional_nfts.id))
      .limit(50);
  }

  async createRelayerTx(insertTx: InsertRelayerTx): Promise<RelayerTransaction> {
    const [tx] = await db
      .insert(relayer_transactions)
      .values(insertTx)
      .returning();
    return tx;
  }

  async getRelayerTxs(): Promise<RelayerTransaction[]> {
    return await db
      .select()
      .from(relayer_transactions)
      .orderBy(desc(relayer_transactions.id))
      .limit(50);
  }
}

export const storage = new DatabaseStorage();
