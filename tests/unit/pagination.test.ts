import assert from "node:assert/strict";
import { test } from "node:test";
import { createAPIClient, type APIClient, type PageResult } from "../../src/index";

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

function v2Cursor(keys: { t: string; v?: unknown }[]): string {
  return `v2.${Buffer.from(JSON.stringify(keys)).toString("base64url")}`;
}

test("pagination reads the date of a v2 cursor for cursorEnd", async () => {
  const older = v2Cursor([{ t: "date", v: "2026-01-01T00:00:00.000Z" }, { t: "str", v: "id" }]);
  const { client, requests } = mockClient([{ items: [{ _id: "first" }], nextCursor: older }]);
  for await (const _page of client.article.getArticlesPaginated({
    type: "last", autoPaginate: true, cursorEnd: new Date("2026-02-01"),
  })) { /* consume */ }
  assert.deepEqual(requests, [{ type: "last" }]);
});

test("pagination goes on past a newer v2 date and a v2 cursor that does not start with a date", async () => {
  const newer = v2Cursor([{ t: "date", v: "2026-03-01T00:00:00.000Z" }, { t: "str", v: "a" }]);
  const byScore = v2Cursor([{ t: "num", v: 61 }, { t: "str", v: "b" }]);
  const { client, requests } = mockClient([
    { items: [{ _id: "first" }], nextCursor: newer },
    { items: [{ _id: "second" }], nextCursor: byScore },
    { items: [{ _id: "third" }] },
  ]);
  for await (const _page of client.article.getArticlesPaginated({
    type: "top", autoPaginate: true, cursorEnd: new Date("2026-02-01"),
  })) { /* consume */ }
  assert.deepEqual(requests, [{ type: "top" }, { type: "top", cursor: newer }, { type: "top", cursor: byScore }]);
});

test("pagination reads a v2 date sent as a string key, as giveaways send endAt", async () => {
  const older = v2Cursor([{ t: "str", v: "2026-01-01T00:00:01.158Z" }, { t: "str", v: "6ade9801e10098309a55fca7" }]);
  const { client, requests } = mockClient([{ items: [{ _id: "first" }], nextCursor: older }]);
  for await (const _page of client.giveaway.getManyPaginated({
    autoPaginate: true, cursorEnd: new Date("2026-02-01"),
  })) { /* consume */ }
  assert.deepEqual(requests, [{}]);
});

test("pagination skips null v2 keys and reads the date after them", async () => {
  const neverMovedNewer = v2Cursor([{ t: "null" }, { t: "date", v: "2026-03-01T00:00:00.000Z" }, { t: "str", v: "a" }]);
  const neverMovedOlder = v2Cursor([{ t: "null" }, { t: "date", v: "2026-01-01T00:00:00.000Z" }, { t: "str", v: "b" }]);
  const { client, requests } = mockClient([
    { items: [{ _id: "first" }], nextCursor: neverMovedNewer },
    { items: [{ _id: "second" }], nextCursor: neverMovedOlder },
  ]);
  for await (const _page of client.company.getCompanies({
    autoPaginate: true, cursorEnd: new Date("2026-02-01"),
  })) { /* consume */ }
  assert.deepEqual(requests, [{}, { cursor: neverMovedNewer }]);
});

test("pagination goes on past v2 string keys that are not timestamps", async () => {
  const byName = v2Cursor([{ t: "str", v: "2026" }, { t: "str", v: "a" }]);
  const idOnly = v2Cursor([{ t: "null" }, { t: "str", v: "6ade9801e10098309a55fca7" }]);
  const { client, requests } = mockClient([
    { items: [{ _id: "first" }], nextCursor: byName },
    { items: [{ _id: "second" }], nextCursor: idOnly },
    { items: [{ _id: "third" }] },
  ]);
  for await (const _page of client.giveaway.getManyPaginated({
    autoPaginate: true, cursorEnd: new Date("2026-02-01"),
  })) { /* consume */ }
  assert.deepEqual(requests, [{}, { cursor: byName }, { cursor: idOnly }]);
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

test("pagination stops when the server repeats the cursor it was just sent", async () => {
  const { client, requests } = mockClient([
    { items: [{ _id: "first" }], nextCursor: "same" },
    { items: [{ _id: "second" }], nextCursor: "same" },
  ]);
  const pages = [];
  for await (const page of client.article.getArticlesPaginated({ type: "last", autoPaginate: true })) pages.push(page);
  assert.deepEqual(requests, [{ type: "last" }, { type: "last", cursor: "same" }]);
  assert.equal(pages.length, 2);
});

test("pagination stops when the cursors run in a cycle", async () => {
  const { client, requests } = mockClient([
    { items: [{ _id: "first" }], nextCursor: "a" },
    { items: [{ _id: "second" }], nextCursor: "b" },
    { items: [{ _id: "third" }], nextCursor: "a" },
  ]);
  for await (const _page of client.article.getArticlesPaginated({ type: "last", autoPaginate: true })) { /* consume */ }
  assert.deepEqual(requests, [{ type: "last" }, { type: "last", cursor: "a" }, { type: "last", cursor: "b" }]);
});

test("pagination stops when the server returns the cursor the crawl started from", async () => {
  const { client, requests } = mockClient([
    { items: [{ _id: "first" }], nextCursor: "start" },
  ]);
  for await (const _page of client.article.getArticlesPaginated({ type: "last", cursor: "start", autoPaginate: true })) { /* consume */ }
  assert.equal(requests.length, 1);
});

test("a fractional maxPages is rounded down", async () => {
  const { client, requests } = mockClient([
    { items: [{ _id: "first" }], nextCursor: "more" },
  ]);
  for await (const _page of client.article.getArticlesPaginated({
    type: "last", autoPaginate: true, maxPages: 1.5,
  })) { /* consume */ }
  assert.equal(requests.length, 1);
});

test("a legacy cursor that starts with a number is not read as a date", async () => {
  const { client, requests } = mockClient([
    { items: [{ _id: "first" }], nextCursor: "2026|id-1" },
    { items: [{ _id: "second" }] },
  ]);
  for await (const _page of client.article.getArticlesPaginated({
    type: "last", autoPaginate: true, cursorEnd: new Date("2026-02-01"),
  })) { /* consume */ }
  assert.deepEqual(requests, [{ type: "last" }, { type: "last", cursor: "2026|id-1" }]);
});

test("a legacy cursor with a missing part stops the crawl, an id that only contains the word does not", async () => {
  const withWord = "2026-03-01T00:00:00Z|item-undefined-1";
  const { client, requests } = mockClient([
    { items: [{ _id: "first" }], nextCursor: withWord },
    { items: [{ _id: "second" }], nextCursor: "2026-03-01T00:00:00Z|undefined" },
  ]);
  for await (const _page of client.article.getArticlesPaginated({ type: "last", autoPaginate: true })) { /* consume */ }
  assert.deepEqual(requests, [{ type: "last" }, { type: "last", cursor: withWord }]);
});

test("autoPaginate on a procedure that is not paginated is a type error and throws", async () => {
  const requests: unknown[] = [];
  const client = createAPIClient({
    url: "https://api.example.test/trpc",
    retry: false,
    rateLimit: 60000,
    fetch: (async (_url, init) => {
      requests.push(JSON.parse(String(init?.body))["0"]);
      return new Response(JSON.stringify([{ result: { data: { results: [1, 2], nextPage: 2 } } }]), {
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch,
  });
  const input = { regionId: "r", page: 1, autoPaginate: true };
  // @ts-expect-error contribution.getRegionContributions pages by `page`, not by cursor
  const pages = client.contribution.getRegionContributions(input) as unknown as AsyncIterable<unknown>;
  await assert.rejects(async () => {
    for await (const _page of pages) { /* consume */ }
  }, (error: Error) => error instanceof TypeError && /contribution\.getRegionContributions/.test(error.message) && /items/.test(error.message));
  assert.deepEqual(requests, [{ regionId: "r", page: 1 }]);

  // The harmless options still pass through a variable and are stripped, as on any regular call.
  const regular = { regionId: "r", page: 2, autoPaginate: false as const, maxPages: 3 };
  const value: { results: unknown[] } = await client.contribution.getRegionContributions(regular);
  assert.deepEqual(value.results, [1, 2]);
  assert.deepEqual(requests[1], { regionId: "r", page: 2 });
});

test("a null maxPages from JavaScript means no cap, like leaving it out", async () => {
  const { client, requests } = mockClient([
    { items: [{ _id: "first" }], nextCursor: "more" },
    { items: [{ _id: "second" }] },
  ]);
  for await (const _page of client.article.getArticlesPaginated({
    type: "last", autoPaginate: true, maxPages: null as unknown as number,
  })) { /* consume */ }
  assert.equal(requests.length, 2);
});

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type PageOf<F> = F extends { (input: any, options?: any): AsyncIterableIterator<infer P> } ? P : never;
// PageResult names the page of a packaged custom procedure too, not only of an OpenAPI one.
type _customPage = Expect<Equal<PageResult<"giveaway.getManyPaginated">, PageOf<APIClient["giveaway"]["getManyPaginated"]>>>;
type _documentedPage = Expect<Equal<PageResult<"battle.getBattles">, PageOf<APIClient["battle"]["getBattles"]>>>;