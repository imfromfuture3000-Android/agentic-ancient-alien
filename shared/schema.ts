import { pgTable, text, serial, timestamp, numeric, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const alien_signals = pgTable("alien_signals", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  transactionHash: text("transaction_hash").notNull(),
  amount: numeric("amount").notNull(),
  status: text("status").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const emotional_nfts = pgTable("emotional_nfts", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  emotion: text("emotion").notNull(),
  mintHash: text("mint_hash").notNull(),
  zkCompressed: boolean("zk_compressed").default(true),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const relayer_transactions = pgTable("relayer_transactions", {
  id: serial("id").primaryKey(),
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  originalFee: numeric("original_fee").notNull(),
  actualFee: numeric("actual_fee").default("0"),
  savings: numeric("savings").notNull(),
  status: text("status").notNull(),
  txHash: text("tx_hash"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertAlienSignalSchema = createInsertSchema(alien_signals).omit({ 
  id: true, 
  timestamp: true 
});

export const insertEmotionalNftSchema = createInsertSchema(emotional_nfts).omit({
  id: true,
  timestamp: true
});

export const insertRelayerTxSchema = createInsertSchema(relayer_transactions).omit({
  id: true,
  timestamp: true
});

export type AlienSignal = typeof alien_signals.$inferSelect;
export type InsertAlienSignal = z.infer<typeof insertAlienSignalSchema>;

export type EmotionalNft = typeof emotional_nfts.$inferSelect;
export type InsertEmotionalNft = z.infer<typeof insertEmotionalNftSchema>;

export type RelayerTransaction = typeof relayer_transactions.$inferSelect;
export type InsertRelayerTx = z.infer<typeof insertRelayerTxSchema>;

export const agent_learnings = pgTable("agent_learnings", {
  id: serial("id").primaryKey(),
  skill: text("skill").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  errorPattern: text("error_pattern"),
  fixApplied: text("fix_applied"),
  confidence: numeric("confidence").default("0.5"),
  occurrences: serial("occurrences"),
  status: text("status").notNull().default("learned"),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const owned_assets = pgTable("owned_assets", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  assetType: text("asset_type").notNull(),
  name: text("name"),
  symbol: text("symbol"),
  ownerWallet: text("owner_wallet").notNull(),
  transferStatus: text("transfer_status").default("owned"),
  onChainData: jsonb("on_chain_data"),
  discoveredAt: timestamp("discovered_at").defaultNow(),
});

export const insertAgentLearningSchema = createInsertSchema(agent_learnings).omit({ id: true, timestamp: true });
export const insertOwnedAssetSchema = createInsertSchema(owned_assets).omit({ id: true, discoveredAt: true });

export type AgentLearning = typeof agent_learnings.$inferSelect;
export type InsertAgentLearning = z.infer<typeof insertAgentLearningSchema>;
export type OwnedAsset = typeof owned_assets.$inferSelect;
export type InsertOwnedAsset = z.infer<typeof insertOwnedAssetSchema>;
