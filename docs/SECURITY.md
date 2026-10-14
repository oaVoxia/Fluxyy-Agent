# Fluxyy security and production gate

## Current capability boundary
- Reads live Solana RPC state and public DEX pair snapshots.
- Performs transparent, caller-supplied paper candidate screening.
- Supports an x402 V2 payment-gated API route when explicitly configured.
- Does not construct, sign, or broadcast trading transactions. `liveExecutionAllowed` is hard-coded false by design.

## Before production
1. Use a dedicated Solana RPC provider with quota, regional redundancy, websocket support if needed, and documented SLAs.
2. Pin the full `getGenesisHash` value (not merely the x402 CAIP-2 network identifier) and verify it in deployment health checks.
3. Review and pin x402 package versions after confirming the facilitator `/supported` response includes the exact V2 `exact` scheme and configured CAIP-2 network.
4. Use a production facilitator, not the public x402.org development facilitator.
5. Configure a valid recipient token account for the stablecoin and network accepted by the facilitator.
6. Add a persistent database for request idempotency, payment replay prevention (handled by conforming x402 SDK/facilitator), trade intents, audit events, and PnL.
7. Put keys behind an external signer/HSM. Do not place private keys in environment variables or this service.
8. Add monitoring/alerts, backups, request limits, DDoS protection, secret rotation, dependency scanning, and incident runbooks.
9. Obtain independent security review and run integration tests against a dedicated devnet wallet/facilitator before considering mainnet.
10. Validate every trading route with actual executable quotes, route simulation, token mint allowlists, min-out bounds, compute/priority fee caps, transaction simulation, and confirmation monitoring.

## Strategy warning
A spread between indicative DEX pair prices is not an arbitrage opportunity. It ignores route depth, pool state, token transfer restrictions, fees, slippage, priority fees, landing probability, latency, and adverse selection. Never execute based on `crossPairGrossSpreadBps` alone.
