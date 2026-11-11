import assert from "node:assert/strict";
import { test } from "node:test";
import { createAPIClient } from "../../src/index";
import { createRateLimitedFetch } from "../../src/trpc-client";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function jsonResponse(body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", ...headers },
  });
}

test("maxBatchSize splits a batch into POST requests with the input in the body", async () => {
  const requests: { method?: string; url: string; body: Record<string, unknown> }[] = [];
  const client = createAPIClient({
    url: "https://api.example.test/trpc",
    retry: false,
    rateLimit: 60000,
    maxBatchSize: 2,
    fetch: (async (url, init) => {
      const body = JSON.parse(String(init?.body));
      requests.push({ method: init?.method, url: String(url), body });
      return jsonResponse(Object.values(body).map((input: any) => ({ result: { data: input.userId } })));
    }) as typeof fetch,
  });

  const ids = ["a", "b", "c", "d", "e"];
  const results = await Promise.all(ids.map((userId) => client.user.getUserLite({ userId })));

  assert.deepEqual(results, ids);
  assert.equal(requests.length, 3);
  for (const request of requests) {
    assert.equal(request.method, "POST");
    assert.ok(!new URL(request.url).searchParams.has("input"), `input in the URL: ${request.url}`);
  }
  assert.deepEqual(requests.map((request) => Object.keys(request.body).length), [2, 2, 1]);
});

test("the rate limiter holds the queue until ratelimit-reset when ratelimit-remaining is 0", async () => {
  const starts: number[] = [];
  const f = (async () => {
    starts.push(Date.now());
    return new Response("ok", {
      headers: starts.length === 1 ? { "ratelimit-remaining": "0", "ratelimit-reset": "0.2" } : {},
    });
  }) as typeof fetch;

  const limited = createRateLimitedFetch(f, 60000);
  await limited("https://api.example.test/trpc/a");
  await limited("https://api.example.test/trpc/b");

  assert.ok(starts[1] - starts[0] >= 190, `second request started after ${starts[1] - starts[0]} ms`);
});

test("followServer spaces requests by the limit the server reports", async () => {
  const starts: number[] = [];
  const f = (async () => {
    starts.push(Date.now());
    // 600 per 6 seconds is 6000 per minute: one start every 10 ms.
    return new Response("ok", { headers: { "ratelimit-policy": "600;w=6", "ratelimit-remaining": "500" } });
  }) as typeof fetch;

  // Starts at 60 per minute, one request per second, until the first response arrives.
  const limited = createRateLimitedFetch(f, 60, true);
  await limited("https://api.example.test/trpc/a");
  const startedAt = Date.now();
  await Promise.all(Array.from({ length: 4 }, () => limited("https://api.example.test/trpc/b")));

  // A fixed 60 per minute would need about four seconds for these.
  assert.ok(Date.now() - startedAt < 500, `four requests took ${Date.now() - startedAt} ms`);
});

test("an aborted call rejects at once and its queued request is never sent", async () => {
  const sent: string[] = [];
  const client = createAPIClient({
    url: "https://api.example.test/trpc",
    retry: false,
    // One request per second, so the second call waits in the queue.
    rateLimit: 60,
    maxBatchSize: 1,
    fetch: (async (url) => {
      sent.push(String(url));
      return jsonResponse([{ result: { data: "ok" } }]);
    }) as typeof fetch,
  });

  assert.equal(await client.user.getUserLite({ userId: "first" }), "ok");
  const controller = new AbortController();
  const waiting = client.user.getUserLite({ userId: "second" }, { signal: controller.signal });
  await sleep(20);
  const abortedAt = Date.now();
  controller.abort();

  await assert.rejects(waiting, (error: any) => /abort/i.test(String(error?.message ?? error?.cause)));
  assert.ok(Date.now() - abortedAt < 200, "the abort waited for the queue");
  await sleep(1100);
  assert.equal(sent.length, 1);
});

test("an aborted call rejects at once while another call still needs its batch", async () => {
  const sent: string[] = [];
  const client = createAPIClient({
    url: "https://api.example.test/trpc",
    retry: false,
    rateLimit: 60000,
    fetch: (async (url, init) => {
      sent.push(String(url));
      await sleep(150);
      const body = JSON.parse(String(init?.body));
      return jsonResponse(Object.values(body).map((input: any) => ({ result: { data: input.userId } })));
    }) as typeof fetch,
  });

  // Made in the same tick, so both calls share one HTTP request.
  const controller = new AbortController();
  const kept = client.user.getUserLite({ userId: "kept" });
  const aborted = client.user.getUserLite({ userId: "aborted" }, { signal: controller.signal });
  await sleep(20);
  const abortedAt = Date.now();
  controller.abort();

  await assert.rejects(aborted, (error: any) => error?.cause?.name === "AbortError");
  assert.ok(Date.now() - abortedAt < 100, "the abort waited for the batch");
  assert.equal(await kept, "kept");
  assert.equal(sent.length, 1);

  // A signal that is already aborted never reaches the network.
  await assert.rejects(
    client.user.getUserLite({ userId: "late" }, { signal: controller.signal }),
    (error: any) => error?.cause?.name === "AbortError"
  );
  await sleep(20);
  assert.equal(sent.length, 1);
});

test("a relative url keeps the readable error for a response that is not JSON", async () => {
  const client = createAPIClient({
    url: "/trpc",
    retry: false,
    rateLimit: 60000,
    fetch: (async () =>
      new Response("<html>502 Bad Gateway</html>", { status: 502, statusText: "Bad Gateway" })) as typeof fetch,
  });

  await assert.rejects(client.user.getUserLite({ userId: "a" }), (error: any) =>
    /HTTP 502 Bad Gateway/.test(String(error?.message)) && error?.data?.httpStatus === 502
  );
});

test("timeoutMs aborts a request without response headers and the retry succeeds", async () => {
  let calls = 0;
  const client = createAPIClient({
    url: "https://api.example.test/trpc",
    rateLimit: 60000,
    timeoutMs: 50,
    retry: { maxRetries: 2, initialDelayMs: 1, jitter: false },
    fetch: ((_url: RequestInfo | URL, init?: RequestInit) => {
      calls++;
      if (calls === 1) {
        // Hangs until the timeout aborts it.
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(init.signal!.reason));
        });
      }
      return Promise.resolve(jsonResponse([{ result: { data: "ok" } }]));
    }) as typeof fetch,
  });

  assert.equal(await client.user.getUserLite({ userId: "a" }), "ok");
  assert.equal(calls, 2);
});
