import assert from "node:assert/strict";
import { test } from "node:test";
import { createAPIClient, VOID_INPUT_PROCEDURES } from "../../src";

function mockClient(output: unknown, options: { voidInputProcedures?: string[] } = {}) {
  const requests: { path: string; input: Record<string, unknown> }[] = [];
  const client = createAPIClient({
    retry: false,
    ...options,
    fetch: (async (url, init) => {
      requests.push({
        path: new URL(String(url)).pathname.split("/").pop()!,
        input: JSON.parse(String(init?.body)),
      });
      return new Response(JSON.stringify([{ result: { data: output } }]), {
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch,
  });
  return { client, requests };
}

function procedure(client: unknown, path: string): () => Promise<unknown> {
  return path.split(".").reduce<any>((node, key) => node[key], client);
}

test("every void-input procedure sends no input while other no-input calls keep the {} default", async () => {
  const { client, requests } = mockClient(123);
  for (const path of VOID_INPUT_PROCEDURES) {
    await procedure(client, path)();
    assert.deepEqual(requests.at(-1), { path, input: {} }, `${path} must send a body without an input slot`);
  }
  const development: number = await client.gameStat.getWorldDevelopment();
  assert.equal(development, 123);
  await client.gameConfig.getDates();
  assert.deepEqual(requests.at(-1), { path: "gameConfig.getDates", input: { "0": {} } });
});

test("voidInputProcedures option extends the built-in set", async () => {
  const { client, requests } = mockClient(1, { voidInputProcedures: ["gameConfig.getDates"] });
  await client.gameConfig.getDates();
  assert.deepEqual(requests[0], { path: "gameConfig.getDates", input: {} });
  await client.region.getAll();
  assert.deepEqual(requests[1], { path: "region.getAll", input: { "0": {} } });
});

test("new cursor endpoints support pagination and keep options out of API input", async () => {
  const { client, requests } = mockClient({ items: [], nextCursor: null });
  const pages = [];
  for await (const page of client.giveaway.getManyPaginated({
    limit: 5, autoPaginate: true, maxPages: 1,
  })) pages.push(page);
  assert.deepEqual(pages, [{ items: [], cursor: "" }]);
  assert.deepEqual(requests[0], {
    path: "giveaway.getManyPaginated", input: { "0": { limit: 5 } },
  });
});
