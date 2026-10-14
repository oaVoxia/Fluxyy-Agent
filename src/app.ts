import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import type { RequestHandler } from "express";
import { z } from "zod";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { SolanaRpc } from "./rpc.js";
import { MarketData } from "./market.js";
import { evaluateArbitrageCandidate } from "./strategy.js";

export function createApp(deps: { rpc?: SolanaRpc; market?: MarketData } = {}, paymentGate?: RequestHandler) {
  const app = express();
  const rpc = deps.rpc ?? new SolanaRpc();
  const market = deps.market ?? new MarketData();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "32kb", strict: true }));
  app.use(pinoHttp({ logger }));
  // Payment middleware must be registered before route handlers so it can challenge protected routes.
  if (paymentGate) app.use(paymentGate);
  app.get("/health", (_req, res) => res.json({ name: "fluxyy", status: "ok", liveExecution: false, timestamp: new Date().toISOString() }));

  app.get("/v1/status", async (_req, res) => {
    try {
      const chain = await rpc.health();
      res.json({ name: "fluxyy", status: "ok", chain, liveExecution: false });
    } catch (error) {
      res.status(503).json({ error: "solana_rpc_unavailable", message: error instanceof Error ? error.message : "Unknown RPC error" });
    }
  });

  app.get("/v1/market/:mint", async (req, res) => {
    try {
      const result = await market.analyzeMint(req.params.mint);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Market data error";
      const status = message.startsWith("Invalid Solana") ? 400 : 502;
      res.status(status).json({ error: "market_data_unavailable", message });
    }
  });

  const candidateSchema = z.object({
    notionalUsd: z.number().finite().positive(),
    estimatedGrossProfitUsd: z.number().finite(),
    estimatedFeesUsd: z.number().finite().nonnegative(),
    estimatedSlippageUsd: z.number().finite().nonnegative(),
    estimatedFailureCostUsd: z.number().finite().nonnegative(),
    slippageBps: z.number().finite().nonnegative(),
    dailyPnlUsd: z.number().finite()
  }).strict();

  app.post("/v1/strategy/evaluate", (req, res) => {
    const parsed = candidateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid_candidate", issues: parsed.error.issues });
    return res.json(evaluateArbitrageCandidate(parsed.data));
  });

  app.get("/v1/paid/overview", (_req, res) => {
    res.json({
      agent: "fluxyy",
      product: "Solana market intelligence and risk-screening API",
      capabilities: ["live RPC health", "DEX pair market snapshots", "paper arbitrage screening"],
      liveTrading: false,
      payment: config.X402_ENABLED ? "x402 configured at startup" : "x402 disabled; set X402_ENABLED=true and configure recipient/facilitator",
      asOf: new Date().toISOString()
    });
  });

  app.use((_req, res) => res.status(404).json({ error: "not_found" }));
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error({ err }, "request failed");
    res.status(500).json({ error: "internal_error" });
  });
  return app;
}