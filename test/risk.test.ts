import test from "node:test";
import assert from "node:assert/strict";
import { assessCandidate } from "../src/risk.js";

const good = {
  notionalUsd: 10,
  estimatedGrossProfitUsd: 1,
  estimatedFeesUsd: 0.1,
  estimatedSlippageUsd: 0.1,
  estimatedFailureCostUsd: 0.1,
  slippageBps: 10,
  dailyPnlUsd: 0
};

test("positive net candidate is paper-eligible but never live-executable", () => {
  const result = assessCandidate(good);
  assert.equal(result.acceptedForPaperEvaluation, true);
  assert.equal(result.liveExecutionAllowed, false);
  assert.equal(result.estimatedNetProfitUsd, 0.7);
});

test("rejects notional above configured max", () => {
  const result = assessCandidate({ ...good, notionalUsd: 1000 });
  assert.equal(result.acceptedForPaperEvaluation, false);
  assert.ok(result.reasons.includes("trade_exceeds_max_notional"));
});

test("rejects negative net expected profit", () => {
  const result = assessCandidate({ ...good, estimatedFeesUsd: 2 });
  assert.equal(result.acceptedForPaperEvaluation, false);
  assert.ok(result.reasons.includes("non_positive_estimated_net_profit"));
});

test("rejects slippage above configured maximum", () => {
  const result = assessCandidate({ ...good, slippageBps: 999 });
  assert.equal(result.acceptedForPaperEvaluation, false);
  assert.ok(result.reasons.includes("slippage_limit_exceeded"));
});

test("rejects at daily loss limit", () => {
  const result = assessCandidate({ ...good, dailyPnlUsd: -50 });
  assert.equal(result.acceptedForPaperEvaluation, false);
  assert.ok(result.reasons.includes("daily_loss_limit_reached"));
});

test("rejects non-finite input", () => {
  const result = assessCandidate({ ...good, estimatedGrossProfitUsd: Number.NaN });
  assert.equal(result.acceptedForPaperEvaluation, false);
  assert.ok(result.reasons.includes("non_finite_input"));
});