# fluxyy

Fluxyy is a Solana market-intelligence and risk-screening service with x402 V2 payment-gated API support. This initial codebase intentionally does not sign or broadcast trades; no profitable strategy or mainnet execution claim is made.

## Requirements
- Node.js 20.11+
- npm
- Solana RPC endpoint (devnet default)
- Optional x402 facilitator and recipient account for paid API access

## Run locally
```bash
cp .env.example .env
npm install
npm run typecheck
npm test
npm run dev
```

Check:
- `GET /health`
- `GET /v1/status` — live RPC `getGenesisHash` and `getSlot`
- `GET /v1/market/:mint` — live DexScreener pair data
- `POST /v1/strategy/evaluate` — risk-screen candidate
- `GET /v1/paid/overview` — x402-gated only if enabled

Example paper evaluation:
```bash
curl -s http://127.0.0.1:4021/v1/strategy/evaluate \\
  -H 'content-type: application/json' \\
  -d '{"notionalUsd":10,"estimatedGrossProfitUsd":1,"estimatedFeesUsd":0.1,"estimatedSlippageUsd":0.1,"estimatedFailureCostUsd":0.1,"slippageBps":10,"dailyPnlUsd":0}'
```

## x402 V2
Set `X402_ENABLED=true`, `X402_PAY_TO`, `X402_NETWORK`, `X402_FACILITATOR_URL`, and `X402_PRICE_USD`. The x402 SDK middleware protects `GET /v1/paid/overview`. Confirm the facilitator's `/supported` endpoint includes the exact configured scheme/network pair before deployment. The default facilitator URL is for development only.

For local devnet:
```env
X402_ENABLED=true
X402_NETWORK=solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1
X402_PAY_TO=<your-recipient-address>
X402_FACILITATOR_URL=https://x402.org/facilitator
```
Do not use that public facilitator for mainnet production.

## Safety defaults
- `LIVE_TRADING_ENABLED=false` by default.
- The execution gate is hard-coded closed; no transaction signing or broadcasting exists.
- Risk evaluation rejects oversized trades, excess slippage, daily loss limit breaches, non-finite values, and non-positive estimated net returns.
- Secrets and payment-signature headers are redacted from logs.

## Container
```bash
docker build -t fluxyy .
docker run --rm -p 4021:4021 --env-file .env fluxyy
```

## Audit status
The x402 payment middleware is installed before application routes so the protected overview route can actually return a 402 challenge. The project includes unit and HTTP smoke tests. Run them in your own Node/npm environment; external package installation and live provider calls have not been run in this workspace. Passing these tests would not constitute a production security audit.
