import pino from "pino";
import { config } from "./config.js";

export const logger = pino({
  level: config.LOG_LEVEL,
  redact: {
    paths: ["req.headers.authorization", "req.headers.payment-signature", "req.headers.cookie", "*.privateKey", "*.secret", "*.token"],
    censor: "[REDACTED]"
  }
});