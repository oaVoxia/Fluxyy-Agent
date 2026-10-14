import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

test("health route identifies fluxyy and hard-locks live execution", async () => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    assert.equal(response.status, 200);
    const body = await response.json() as { name: string; liveExecution: boolean };
    assert.equal(body.name, "fluxyy");
    assert.equal(body.liveExecution, false);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});

test("strategy endpoint validates schema", async () => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/strategy/evaluate`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ notionalUsd: -1 })
    });
    assert.equal(response.status, 400);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});