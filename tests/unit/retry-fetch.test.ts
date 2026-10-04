import { test } from "node:test";
import { createRetryFetch, type RetryInfo } from "../../src/trpc-client";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function testRetriesNetworkErrors() {
  let calls = 0;
  const retryEvents: RetryInfo[] = [];

  const fetchWithDrops = (async () => {
    calls++;
    if (calls < 3) {
      const error = new TypeError("fetch failed") as TypeError & {
        cause?: { code: string };
      };
      error.cause = { code: "ECONNRESET" };
      throw error;
    }

    return new Response("ok", { status: 200 });
  }) as typeof fetch;

  const retryFetch = createRetryFetch(fetchWithDrops, {
    maxRetries: 3,
    initialDelayMs: 1,
    jitter: false,
    onRetry: (info) => retryEvents.push(info),
  });

  const response = await retryFetch("https://api.example.test/trpc/user.get", {
    method: "POST",
    body: "{}",
  });

  assert(response.status === 200, "network retry should eventually return the successful response");
  assert(calls === 3, `expected 3 fetch calls, received ${calls}`);
  assert(retryEvents.length === 2, `expected 2 retry events, received ${retryEvents.length}`);
  assert(retryEvents[0].reason.includes("ECONNRESET"), "retry reason should include the reset code");
}

async function testRetriesTransientStatuses() {
  let calls = 0;

  const fetchWith503 = (async () => {
    calls++;
    return new Response(calls === 1 ? "try again" : "ok", {
      status: calls === 1 ? 503 : 200,
    });
  }) as typeof fetch;

  const retryFetch = createRetryFetch(fetchWith503, {
    maxRetries: 2,
    initialDelayMs: 1,
    jitter: false,
  });

  const response = await retryFetch("https://api.example.test/trpc/a,b?batch=1", {
    method: "POST",
    body: "{}",
  });

  assert(response.status === 200, "retryable status should recover to the successful response");
  assert(calls === 2, `expected 2 fetch calls, received ${calls}`);
}

async function testDoesNotRetryClientErrors() {
  let calls = 0;

  const fetchWith400 = (async () => {
    calls++;
    return new Response("bad request", { status: 400 });
  }) as typeof fetch;

  const retryFetch = createRetryFetch(fetchWith400, {
    maxRetries: 3,
    initialDelayMs: 1,
    jitter: false,
  });

  const response = await retryFetch("https://api.example.test/trpc/user.get", {
    method: "POST",
    body: "{}",
  });

  assert(response.status === 400, "client errors should be returned without retrying");
  assert(calls === 1, `expected 1 fetch call, received ${calls}`);
}

test("retries network errors", testRetriesNetworkErrors);
test("retries transient statuses", testRetriesTransientStatuses);
test("does not retry client errors", testDoesNotRetryClientErrors);
