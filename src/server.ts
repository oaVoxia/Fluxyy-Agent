import { HTTPFacilitatorClient } from "@x402/core/server";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import type { RequestHandler } from "express";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { createApp } from "./app.js";

let paymentGate: RequestHandler | undefined;

if (config.X402_ENABLED) {
  if (!config.X402_PAY_TO) throw new Error("X402_PAY_TO is required when X402_ENABLED=true");
  const x402Network = config.X402_NETWORK as `${string}:${string}`;
  const facilitator = new HTTPFacilitatorClient({ url: config.X402_FACILITATOR_URL });
  const resourceServer = new x402ResourceServer(facilitator).register(
    x402Network,
    new ExactSvmScheme()
  );
  paymentGate = paymentMiddleware({
    "GET /v1/paid/overview": {
      accepts: [{
        scheme: "exact",
        price: config.X402_PRICE_USD,
        network: x402Network,
        payTo: config.X402_PAY_TO
      }],
      description: "Fluxyy agent capabilities overview",
      mimeType: "application/json"
    }
  }, resourceServer);
}

const app = createApp({}, paymentGate);
const server = app.listen(config.PORT, config.HOST, () => {
  logger.info({ host: config.HOST, port: config.PORT, x402Enabled: config.X402_ENABLED, liveTrading: false }, "fluxyy listening");
});

function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  server.close(err => {
    if (err) {
      logger.error({ err }, "shutdown failed");
      process.exitCode = 1;
    }
  });
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));