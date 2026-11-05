import assert from "node:assert/strict";
import { test } from "node:test";
import { createAPIClient } from "../../src/index";
import { createRetryFetch } from "../../src/trpc-client";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const url = "https://api.example.test/trpc/a,b?batch=1";
const fast = { maxRetries: 3, initialDelayMs: 1, jitter: false } as const;

function countingFetch(respond: (call: number) => Response | Promise<Response>) {
  let calls = 0;
  const f = (async () => respond(++calls)) as typeof fetch;
  return { f, calls: () => calls };
}

test("409 CONFLICT is not retried", async () => {
  const server = countingFetch(() => new Response("conflict", { status: 409 }));
  const response = await createRetryFetch(server.f, fast)(url, { method: "POST", body: "{}" });
  assert.equal(response.status, 409);
  assert.equal(server.calls(), 1);
});

test("a 429 whose ratelimit-reset exceeds maxDelayMs is returned without retrying", async () => {
  const server = countingFetch(() => new Response("slow down", { status: 429, headers: { "ratelimit-reset": "60" } }));
  const response = await createRetryFetch(server.f, fast)(url, { method: "POST", body: "{}" });
  assert.equal(response.status, 429);
  assert.equal(server.calls(), 1);
});

test("a 429 waits for Retry-After before the retry", async () => {
  const server = countingFetch((call) =>
    call === 1
      ? new Response("slow down", { status: 429, headers: { "retry-after": "0.1" } })
      : new Response("ok")
  );
  const delays: number[] = [];
  const begun = Date.now();
  const response = await createRetryFetch(server.f, { ...fast, onRetry: (info) => delays.push(info.delayMs) })(
    url, { method: "POST", body: "{}" }
  );
  assert.equal(response.status, 200);
  assert.deepEqual(delays, [100]);
  assert.ok(Date.now() - begun >= 95, "the retry came before Retry-After");
});

test("ratelimit-reset on a 503 is ignored, because the API sends it with every response", async () => {
  const server = countingFetch((call) =>
    call === 1
      ? new Response("down", { status: 503, headers: { "ratelimit-reset": "60" } })
      : new Response("ok")
  );
  const response = await createRetryFetch(server.f, fast)(url, { method: "POST", body: "{}" });
  assert.equal(response.status, 200);
  assert.equal(server.calls(), 2);
});

test("an abort during the retry wait rejects at once and an AbortError is not retried", async () => {
  const controller = new AbortController();
  const server = countingFetch(() => new Response("down", { status: 503 }));
  const pending = createRetryFetch(server.f, { ...fast, initialDelayMs: 5000 })(
    url, { method: "POST", body: "{}", signal: controller.signal }
  );
  await sleep(10);
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  assert.equal(server.calls(), 1);

  const aborting = countingFetch(() => {
    throw new DOMException("aborted", "AbortError");
  });
  await assert.rejects(createRetryFetch(aborting.f, fast)(url, { method: "POST", body: "{}" }), { name: "AbortError" });
  assert.equal(aborting.calls(), 1);
});

test("a chunk answered with an HTML error page fails only its own calls, and chunks overlap", async () => {
  let inFlight = 0;
  let maxInFlight = 0;
  const client = createAPIClient({
    url: "https://api.example.test/trpc",
    retry: false,
    rateLimit: 60000,
    maxBatchSize: 1,
    fetch: (async (requestUrl) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await sleep(30);
      inFlight--;
      if (String(requestUrl).includes("getPpMoneyValueByItem")) {
        return new Response("<html>502 Bad Gateway</html>", { status: 502, statusText: "Bad Gateway" });
      }
      return new Response(JSON.stringify([{ result: { data: 0.09 } }]), {
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch,
  });

  const [ok, failed] = await Promise.allSettled([
    client.gameStat.getPpMoneyValue(),
    client.gameStat.getPpMoneyValueByItem(),
  ]);
  assert.deepEqual(ok, { status: "fulfilled", value: 0.09 });
  assert.equal(failed.status, "rejected");
  assert.match(String((failed as PromiseRejectedResult).reason?.message), /HTTP 502 Bad Gateway/);
  assert.equal((failed as PromiseRejectedResult).reason?.data?.httpStatus, 502);
  assert.equal(maxInFlight, 2);
});

test("cursorEnd accepts a date string and rejects an invalid value", async () => {
  const requests: unknown[] = [];
  const client = createAPIClient({
    url: "https://api.example.test/trpc",
    retry: false,
    rateLimit: 60000,
    fetch: (async (_url, init) => {
      requests.push(JSON.parse(String(init?.body))["0"]);
      return new Response(JSON.stringify([{ result: { data: { items: [{ _id: "x" }], nextCursor: "2026-01-01T00:00:00Z|x" } } }]));
    }) as typeof fetch,
  });

  const fromString = client.article.getArticlesPaginated({
    type: "last", autoPaginate: true, cursorEnd: "2026-02-01" as unknown as Date,
  });
  for await (const _page of fromString) { /* consume */ }
  assert.equal(requests.length, 1, "a string cursorEnd should stop like a Date");

  const invalid = client.article.getArticlesPaginated({
    type: "last", autoPaginate: true, cursorEnd: "soon" as unknown as Date,
  });
  await assert.rejects(invalid.next(), RangeError);
});
