import assert from "node:assert/strict";
import { test } from "node:test";
import { createAPIClient } from "../../src/index";
import { createRateLimitedFetch } from "../../src/trpc-client";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("the client is not a thenable, so awaiting it resolves to the client", async () => {
  let requests = 0;
  const client = createAPIClient({
    url: "https://api.example.test/trpc",
    fetch: (async () => {
      requests++;
      return new Response("[]");
    }) as typeof fetch,
  });
  const resolved = await Promise.race([
    Promise.resolve(client),
    sleep(200).then(() => "timeout"),
  ]);
  assert.equal(resolved, client);
  assert.equal(requests, 0);
});

test("the rate limiter spaces request starts without waiting for responses", async () => {
  let inFlight = 0;
  let maxInFlight = 0;
  const starts: number[] = [];
  const slowFetch = (async () => {
    starts.push(Date.now());
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await sleep(100);
    inFlight--;
    return new Response("ok");
  }) as typeof fetch;

  // 6000 requests per minute: one start every 10 ms.
  const limited = createRateLimitedFetch(slowFetch, 6000);
  await Promise.all(Array.from({ length: 5 }, () => limited("https://api.example.test/trpc/a")));

  assert.ok(maxInFlight > 1, `expected overlapping requests, max in flight was ${maxInFlight}`);
  for (let i = 1; i < starts.length; i++) {
    assert.ok(starts[i] - starts[i - 1] >= 9, `starts ${i - 1} and ${i} are only ${starts[i] - starts[i - 1]} ms apart`);
  }
});

test("a fetch that throws synchronously rejects its request and the queue keeps going", async () => {
  let calls = 0;
  const throwingFetch = ((() => {
    calls++;
    if (calls === 1) throw new TypeError("invalid header value");
    return Promise.resolve(new Response("ok"));
  }) as unknown) as typeof fetch;

  const limited = createRateLimitedFetch(throwingFetch, 60000);
  await assert.rejects(limited("https://api.example.test/trpc/a"), /invalid header value/);
  const response = await Promise.race([
    limited("https://api.example.test/trpc/b"),
    sleep(200).then(() => null),
  ]);
  assert.ok(response, "the request after the throw never settled");
  assert.equal(await response.text(), "ok");
});
