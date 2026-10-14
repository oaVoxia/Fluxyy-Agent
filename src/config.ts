import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4021),
  HOST: z.string().default("127.0.0.1"),
  SOLANA_RPC_URL: z.string().url().default("https://api.devnet.solana.com"),
  SOLANA_EXPECTED_GENESIS_HASH: z.string().optional(),
  X402_ENABLED: z.enum(["true", "false"]).default("false").transform(v => v === "true"),
  X402_NETWORK: z.string().default("solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1"),
  X402_PAY_TO: z.string().optional(),
  X402_FACILITATOR_URL: z.string().url().default("https://x402.org/facilitator"),
  X402_PRICE_USD: z.string().default("$0.001"),
  LIVE_TRADING_ENABLED: z.enum(["true", "false"]).default("false").transform(v => v === "true"),
  MAX_TRADE_USD: z.coerce.number().positive().default(25),
  MAX_DAILY_LOSS_USD: z.coerce.number().positive().default(50),
  MAX_SLIPPAGE_BPS: z.coerce.number().int().min(1).max(1000).default(30),
  DEXSCREENER_BASE_URL: z.string().url().default("https://api.dexscreener.com"),
  LOG_LEVEL: z.string().default("info")
}).superRefine((v, ctx) => {
  if (v.X402_ENABLED && !v.X402_PAY_TO) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "X402_PAY_TO is required when X402_ENABLED=true", path: ["X402_PAY_TO"] });
  }
  if (v.NODE_ENV === "production" && v.HOST === "0.0.0.0" && !v.SOLANA_EXPECTED_GENESIS_HASH) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Set SOLANA_EXPECTED_GENESIS_HASH for production network pinning", path: ["SOLANA_EXPECTED_GENESIS_HASH"] });
  }
});

export const config = schema.parse(process.env);