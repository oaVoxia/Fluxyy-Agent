import { assessCandidate, type Candidate } from "./risk.js";

export function evaluateArbitrageCandidate(candidate: Candidate) {
  const risk = assessCandidate(candidate);
  return {
    strategy: "cross-venue-arbitrage-screen",
    action: risk.acceptedForPaperEvaluation ? "PAPER_CANDIDATE" : "REJECT",
    ...risk,
    disclaimer: "Indicative estimates only; no executable quotes or transaction signing are performed."
  };
}