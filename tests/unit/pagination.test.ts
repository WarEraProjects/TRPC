import assert from "node:assert/strict";
import { test } from "node:test";
import { createAPIClient } from "../../src/index";

type MockPage = { items: { _id: string }[]; nextCursor?: string };

function mockClient(pages: MockPage[]) {
  const requests: Record<string, unknown>[] = [];
  const client = createAPIClient({
    url: "https://api.example.test/trpc",
    retry: false,
    rateLimit: 60000,
    fetch: (async (_url, init) => {
      const input = JSON.parse(String(init?.body))["0"];
      requests.push(input);
      const page = pages[requests.length - 1];
      assert.ok(page, "unexpected extra page request");
      return new Response(JSON.stringify([{ result: { data: page } }]), {
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch,
  });
  return { client, requests };
}

test("pagination follows cursors and strips client options", async () => {
  const { client, requests } = mockClient([
    { items: [{ _id: "first" }], nextCursor: "next-page" },
    { items: [{ _id: "second" }] },
  ]);
  const pages = [];
  for await (const page of client.article.getArticlesPaginated({
    type: "last", limit: 5, autoPaginate: true, maxPages: 3,
  })) pages.push(page);
  assert.deepEqual(pages, [
    { items: [{ _id: "first" }], cursor: "next-page" },
    { items: [{ _id: "second" }], cursor: "" },
  ]);
  assert.deepEqual(requests, [
    { type: "last", limit: 5 },
    { type: "last", limit: 5, cursor: "next-page" },
  ]);
});

test("pagination respects maxPages", async () => {
  const { client, requests } = mockClient([
    { items: [{ _id: "first" }], nextCursor: "more" },
  ]);
  for await (const _page of client.article.getArticlesPaginated({
    type: "last", autoPaginate: true, maxPages: 1,
  })) { /* consume */ }
  assert.equal(requests.length, 1);
});

test("pagination stops at cursorEnd and omits it from requests", async () => {
  const { client, requests } = mockClient([
    { items: [{ _id: "first" }], nextCursor: "2026-01-01T00:00:00Z|id" },
  ]);
  for await (const _page of client.article.getArticlesPaginated({
    type: "last", autoPaginate: true, cursorEnd: new Date("2026-02-01"),
  })) { /* consume */ }
  assert.deepEqual(requests, [{ type: "last" }]);
});

test("pagination stops on an empty page even when a cursor exists", async () => {
  const { client, requests } = mockClient([{ items: [], nextCursor: "more" }]);
  for await (const page of client.article.getArticlesPaginated({
    type: "last", autoPaginate: true,
  })) assert.deepEqual(page.items, []);
  assert.equal(requests.length, 1);
});

test("regular pagination calls strip client options and preserve server input", async () => {
  const { client, requests } = mockClient([
    { items: [] }, { items: [] }, { items: [] },
  ]);
  const input = { type: "last" as const, limit: 3, autoPaginate: false as const, maxPages: 2 };
  await client.article.getArticlesPaginated(input);
  await client.article.getArticlesPaginated({
    ...input, cursorEnd: new Date("2026-02-01"),
  });
  await client.article.getArticlesPaginated({
    type: "last", limit: 3, cursorEnd: new Date("2026-02-01"),
  });
  assert.deepEqual(requests, [
    { type: "last", limit: 3 },
    { type: "last", limit: 3 },
    { type: "last", limit: 3 },
  ]);
  assert.deepEqual(input, { type: "last", limit: 3, autoPaginate: false, maxPages: 2 });
});

test("regular calls leave an input with its own toJSON() unchanged", async () => {
  const { client, requests } = mockClient([{ items: [] }]);
  const input = { type: "last" as const, autoPaginate: false as const };
  Object.defineProperty(input, "toJSON", { value: () => ({ type: "last", limit: 1 }) });
  await client.article.getArticlesPaginated(input);
  assert.deepEqual(requests, [{ type: "last", limit: 1 }]);
});
