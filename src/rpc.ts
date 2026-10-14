import { config } from "./config.js";

type RpcEnvelope<T> = { result?: T; error?: { code: number; message: string }; id?: number };

export class SolanaRpc {
  private id = 0;
  constructor(private readonly url = config.SOLANA_RPC_URL) {}

  async call<T>(method: string, params: unknown[] = [], timeoutMs = 8_000): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: ++this.id, method, params }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Solana RPC HTTP ${response.status}`);
      const body = await response.json() as RpcEnvelope<T>;
      if (body.error) throw new Error(`Solana RPC ${body.error.code}: ${body.error.message}`);
      if (!("result" in body)) throw new Error("Malformed Solana RPC response");
      return body.result as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async health() {
    const [genesisHash, slot] = await Promise.all([
      this.call<string>("getGenesisHash"),
      this.call<number>("getSlot", [{ commitment: "confirmed" }])
    ]);
    const expected = config.SOLANA_EXPECTED_GENESIS_HASH;
    if (expected && genesisHash !== expected) {
      throw new Error(`RPC network mismatch: expected genesis ${expected}, got ${genesisHash}`);
    }
    return { ok: true as const, genesisHash, slot, endpointHost: new URL(this.url).host };
  }
}