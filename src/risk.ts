import { config } from "./config.js";

export type Candidate = {
  notionalUsd: number;
  estimatedGrossProfitUsd: number;
  estimatedFeesUsd: number;
  estimatedSlippageUsd: number;
  estimatedFailureCostUsd: number;
  slippageBps: number;
  dailyPnlUsd: number;
};

export function assessCandidate(c: Candidate) {
  const numeric = Object.values(c).every(Number.isFinite);
  const estimatedNetProfitUsd = c.estimatedGrossProfitUsd - c.estimatedFeesUsd - c.estimatedSlippageUsd - c.estimatedFailureCostUsd;
  const reasons: string[] = [];
  if (!numeric) reasons.push("non_finite_input");
  if (c.notionalUsd <= 0) reasons.push("notional_must_be_positive");
  if (c.notionalUsd > config.MAX_TRADE_USD) reasons.push("trade_exceeds_max_notional");
  if (c.slippageBps < 0 || c.slippageBps > config.MAX_SLIPPAGE_BPS) reasons.push("slippage_limit_exceeded");
  if (c.dailyPnlUsd <= -config.MAX_DAILY_LOSS_USD) reasons.push("daily_loss_limit_reached");
  if (estimatedNetProfitUsd <= 0) reasons.push("non_positive_estimated_net_profit");
  return {
    acceptedForPaperEvaluation: numeric && reasons.length === 0,
    liveExecutionAllowed: false as const,
    estimatedNetProfitUsd: Number.isFinite(estimatedNetProfitUsd) ? estimatedNetProfitUsd : null,
    reasons,
    controls: { liveTradingEnabled: config.LIVE_TRADING_ENABLED, hardExecutionLock: true }
  };
}