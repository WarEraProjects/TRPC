import assert from "node:assert/strict";
import { test } from "node:test";
import { createAPIClient } from "../../src";

function mockClient(output: unknown) {
  const requests: { path: string; input: Record<string, unknown> }[] = [];
  const client = createAPIClient({
    retry: false,
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

test("world development sends void input while existing no-input calls retain their default", async () => {
  const { client, requests } = mockClient(123);
  const development: number = await client.gameStat.getWorldDevelopment();
  assert.equal(development, 123);
  assert.deepEqual(requests[0], { path: "gameStat.getWorldDevelopment", input: {} });
  await client.gameConfig.getDates();
  assert.deepEqual(requests[1], { path: "gameConfig.getDates", input: { "0": {} } });
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
