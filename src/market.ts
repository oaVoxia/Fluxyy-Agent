import { config } from "./config.js";

export type DexPair = {
  chainId: string; dexId: string; url?: string; pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceUsd?: string; priceNative?: string;
  liquidity?: { usd?: number; base?: number; quote?: number };
  volume?: { h24?: number; h6?: number; h1?: number; m5?: number };
  priceChange?: { h24?: number; h6?: number; h1?: number; m5?: number };
  pairCreatedAt?: number;
};

export class MarketData {
  constructor(private readonly baseUrl = config.DEXSCREENER_BASE_URL) {}

  async tokenPairs(mint: string): Promise<DexPair[]> {
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) throw new Error("Invalid Solana mint address format");
    const response = await fetch(`${this.baseUrl}/token-pairs/v1/solana/${encodeURIComponent(mint)}`, {
      headers: { accept: "application/json", "user-agent": "fluxyy/0.1" },
      signal: AbortSignal.timeout(8_000)
    });
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`Market data provider HTTP ${response.status}`);
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error("Unexpected market data response");
    return (data as DexPair[]).filter(p => p.chainId === "solana" && p.pairAddress && p.baseToken && p.quoteToken);
  }

  async analyzeMint(mint: string) {
    const pairs = await this.tokenPairs(mint);
    const valid = pairs.filter(p => Number.isFinite(Number(p.priceUsd)) && Number(p.priceUsd) > 0);
    const sorted = valid.slice().sort((a, b) => Number(b.liquidity?.usd ?? 0) - Number(a.liquidity?.usd ?? 0));
    const prices = valid.map(p => Number(p.priceUsd));
    const min = prices.length ? Math.min(...prices) : null;
    const max = prices.length ? Math.max(...prices) : null;
    const grossSpreadBps = min && max ? ((max - min) / min) * 10_000 : null;
    return {
      mint,
      provider: "DexScreener",
      fetchedAt: new Date().toISOString(),
      pairCount: pairs.length,
      pricedPairCount: valid.length,
      bestLiquidityPairs: sorted.slice(0, 10).map(p => ({
        dex: p.dexId, pairAddress: p.pairAddress,
        base: p.baseToken.symbol, quote: p.quoteToken.symbol,
        priceUsd: Number(p.priceUsd), liquidityUsd: Number(p.liquidity?.usd ?? 0),
        volume24hUsd: Number(p.volume?.h24 ?? 0), priceChange24hPct: Number(p.priceChange?.h24 ?? 0),
        url: p.url ?? null
      })),
      crossPairGrossSpreadBps: grossSpreadBps,
      warning: "Indicative pair prices only. This is not an executable arbitrage quote; fees, route impact, latency, inventory, and atomic settlement are not included."
    };
  }
}