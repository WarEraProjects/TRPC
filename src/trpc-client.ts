import { createTRPCUntypedClient, httpBatchLink, loggerLink, TRPCClientError } from "@trpc/client";
import type { APIClient, PageResult, ProcedureKey } from "./typed-procedures";

export interface TrpcLikeClientOptions {
  url?: string;
  apiKey?: string;
  logger?: boolean;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
  maxBatchSize?: number;
  /**
   * @deprecated Unused: tRPC's `httpBatchLink` batches the calls made in the same tick and has no interval option.
   */
  batchIntervalMs?: number;
  logBatches?: boolean | ((info: BatchLogInfo) => void);
  retry?: boolean | RetryOptions;
  /**
   * Requests per minute. Without it the client starts at 200 with a non-empty API key,
   * otherwise 100, and then follows the limit the server reports. A batch counts as one request.
   */
  rateLimit?: number;
  /**
   * Abort an HTTP request whose response headers have not arrived after this many
   * milliseconds. The timeout counts as a transient failure and is retried. Off by default.
   */
  timeoutMs?: number;
  /**
   * Extra procedure paths whose input schema is `z.void()`. Merged with
   * {@link VOID_INPUT_PROCEDURES}; use it for custom endpoints registered through `_ce`.
   */
  voidInputProcedures?: string[];
}

/**
 * Procedures whose server-side input schema is `z.void()`. The server rejects `{}` for
 * these, so the client sends no input at all. Every other no-input procedure accepts `{}`.
 */
export const VOID_INPUT_PROCEDURES: ReadonlySet<string> = new Set([
  "gameStat.getWorldDevelopment",
  "gameStat.getPpMoneyValue",
  "gameStat.getPpMoneyValueByItem",
  "gameStat.getBadgeStats",
  "gameStat.getMilestoneStats",
]);

type BatchLogInfo = {
  method: string;
  url: string;
  path: string;
  paths: string[];
  batchSize: number;
  body?: string;
};

export type RetryOptions = {
  /**
   * Number of retries after the initial request fails. Defaults to 3.
   */
  maxRetries?: number;
  /**
   * Initial retry delay in milliseconds. Defaults to 250ms.
   */
  initialDelayMs?: number;
  /**
   * Maximum retry delay in milliseconds. Defaults to 5000ms. A 429 or 503 whose
   * `Retry-After`, or a 429 whose `ratelimit-reset`, asks for a longer wait is returned
   * without retrying.
   */
  maxDelayMs?: number;
  /**
   * Multiplier applied to the delay after each failed attempt. Defaults to 2.
   */
  backoffMultiplier?: number;
  /**
   * Add random jitter to retry delays to avoid synchronized retries. Defaults to true.
   */
  jitter?: boolean;
  /**
   * HTTP status codes that should be retried. Defaults to common transient statuses.
   */
  retryableStatusCodes?: number[];
  /**
   * Optional hook called before each retry attempt.
   */
  onRetry?: (info: RetryInfo) => void;
};

export type RetryInfo = {
  attempt: number;
  maxRetries: number;
  delayMs: number;
  method: string;
  url: string;
  reason: string;
  status?: number;
  error?: unknown;
};

type UntypedClient = {
  query: (path: string, input: unknown, opts?: { signal?: AbortSignal }) => Promise<unknown>;
};

const MAX_MAX_BATCH_SIZE = 50;
// 409 (tRPC CONFLICT) is not transient, so it is not retried.
const DEFAULT_RETRYABLE_STATUS_CODES = [408, 425, 429, 500, 502, 503, 504];
// Statuses whose wait the server may announce, see getServerRetryDelayMs.
const RATE_LIMIT_STATUS_CODES = new Set([429, 503]);

// The `rt` header value as sent since 0.3. It keeps the list it was built from, so
// changing the retry defaults does not change the header.
const RT_STATUS_CODES = [408, 409, 425, 429, 500, 502, 503, 504];

function getResponseStatusCodes() {
  return RT_STATUS_CODES
    .map((status, index) => {
      const mixed = status * (index + 3) + index;
      return mixed.toString(36);
    })
    .join(".");
}

type NormalizedRetryOptions = Required<
  Pick<RetryOptions, "maxRetries" | "initialDelayMs" | "maxDelayMs" | "backoffMultiplier" | "jitter">
> & {
  retryableStatusCodes: Set<number>;
  onRetry?: (info: RetryInfo) => void;
};

/** An ISO 8601 timestamp such as "2026-10-27T00:00:01.158Z". */
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/**
 * Parse the date a cursor starts with. Two formats are known: "{date}|{id}", and "v2." followed by
 * base64url JSON of the sort keys, such as [{"t":"date","v":"2026-11-09T16:48:25.632Z"},{"t":"str","v":"<id>"}].
 *
 * In a v2 cursor the date is the first sort key that has a value:
 * - a `date` key, or a `str` key holding an ISO timestamp (`giveaway.getManyPaginated` sends `endAt` that way);
 * - `null` keys are skipped: `company.getCompanies` sorts by `movedUpAt` and then `createdAt`, and a
 *   company that never moved has [{"t":"null"},{"t":"date","v":"<createdAt>"},{"t":"str","v":"<id>"}].
 *
 * Returns null if the cursor is invalid or empty, if the date cannot be parsed, or if that key is not
 * a date (`article.getArticlesPaginated` sorts `daily`, `weekly` and `top` by a number).
 */
function parseCursorDate(cursor: string | null | undefined): Date | null {
  if (!cursor || typeof cursor !== "string") return null;
  if (cursor.startsWith("v2.")) return parseV2CursorDate(cursor.slice(3));

  const pipeIndex = cursor.indexOf("|");
  if (pipeIndex === -1) return null;
  
  const dateStr = cursor.substring(0, pipeIndex);
  if (dateStr === 'undefined') return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

function parseV2CursorDate(payload: string): Date | null {
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const keys: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    if (!Array.isArray(keys)) return null;
    const first: unknown = keys.find((key) => (key as { t?: unknown } | null)?.t !== "null");
    if (!first || typeof first !== "object") return null;
    const { t, v } = first as { t?: unknown; v?: unknown };
    if (typeof v !== "string") return null;
    if (t !== "date" && !(t === "str" && ISO_TIMESTAMP.test(v))) return null;
    const date = new Date(v);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Async generator that auto-paginates through a cursor-based endpoint.
 * Yields pages until nextCursor is null/empty, maxPages is reached, or cursorEnd is exceeded.
 */
async function* autoPaginate<K extends ProcedureKey>(
  client: UntypedClient,
  path: string,
  input: Record<string, unknown>,
  options: { maxPages?: number; cursorEnd?: Date; signal?: AbortSignal }
): AsyncIterableIterator<PageResult<K>> {
  let currentCursor: string | undefined = input.cursor as string | undefined;
  let pageCount = 0;
  const maxPages = options.maxPages ?? Infinity;
  // JavaScript callers may pass a string or a timestamp; comparing those with a Date never stops.
  const cursorEnd = options.cursorEnd === undefined ? undefined : new Date(options.cursorEnd);
  if (cursorEnd && Number.isNaN(cursorEnd.getTime())) {
    throw new RangeError(`cursorEnd is not a valid date: ${String(options.cursorEnd)}`);
  }

  while (pageCount < maxPages) {
    // Make the request with the current cursor
    const requestInput = currentCursor ? { ...input, cursor: currentCursor } : input;
    const response = (await client.query(path, requestInput, options.signal ? { signal: options.signal } : undefined)) as {
      items: unknown[];
      nextCursor: string;
    };

    // Yield the current page
    yield {
      items: response.items,
      cursor: response.nextCursor || "",
    } as PageResult<K>;

    pageCount++;

    // Check termination conditions
    if (!response.nextCursor || response.items.length === 0 || response.nextCursor.includes('undefined')) {
      break; // No more pages, empty page, or invalid cursor
    }

    // Check cursorEnd condition
    if (cursorEnd) {
      const cursorDate = parseCursorDate(response.nextCursor);
      if (cursorDate && cursorDate < cursorEnd) {
        break; // Next cursor is older than cutoff date
      }
    }

    currentCursor = response.nextCursor;
  }
}

function rateLimitDelayMs(rateLimit: number) {
  const delayMs = Math.floor(60000 / rateLimit);
  // A rate of 0 gives an infinite delay, which no timer can wait for: the queue would
  // never move. As before, a rate that gives no usable delay means no spacing.
  return Number.isFinite(delayMs) ? Math.max(1, delayMs) : 1;
}

/**
 * Requests per minute from the `ratelimit-policy` header (`500;w=60`), or from
 * `ratelimit-limit` for a 60-second window. `null` when neither is usable.
 */
function getServerRateLimit(response: Response): number | null {
  const policy = response.headers.get("ratelimit-policy")?.match(/^\s*(\d+)\s*;\s*w=(\d+)/);
  const limit = policy ? Number(policy[1]) : Number(response.headers.get("ratelimit-limit") ?? NaN);
  const windowSeconds = policy ? Number(policy[2]) : 60;
  if (!(limit > 0) || !(windowSeconds > 0)) return null;
  return (limit * 60) / windowSeconds;
}

/**
 * Space request starts `60000 / rateLimit` ms apart. Requests do not wait for the
 * previous response, so a slow or stalled request does not hold back the queue.
 *
 * Every response's rate limit headers are read. When `ratelimit-remaining` reaches 0,
 * or the server answers 429, the queue holds until `ratelimit-reset`. With
 * `followServer` the spacing also follows the server's limit, so a key with a higher
 * limit than `rateLimit` gets its full rate after the first response.
 *
 * A request whose signal aborts while it waits leaves the queue at once.
 *
 * @internal
 */
export function createRateLimitedFetch(origFetch?: typeof fetch, rateLimit = 100, followServer = false): typeof fetch {
  const f: typeof fetch = origFetch ?? (globalThis as any).fetch;
  let delayMs = rateLimitDelayMs(rateLimit);

  type QueueItem = {
    args: [RequestInfo | URL, RequestInit | undefined];
    resolve: (r: Response | PromiseLike<Response>) => void;
    reject: (e: unknown) => void;
    signal?: AbortSignal | null;
    onAbort?: () => void;
  };

  const queue: QueueItem[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastTime = -Infinity;
  let pausedUntil = 0;

  const observe = (response: Response) => {
    if (followServer) {
      const serverRateLimit = getServerRateLimit(response);
      if (serverRateLimit !== null) delayMs = rateLimitDelayMs(serverRateLimit);
    }
    const remaining = Number(response.headers.get("ratelimit-remaining") ?? NaN);
    const resetMs = response.status === 429
      ? getServerRetryDelayMs(response)
      : Number(response.headers.get("ratelimit-reset") ?? NaN) * 1000;
    if ((response.status === 429 || remaining <= 0) && resetMs !== null && Number.isFinite(resetMs)) {
      pausedUntil = Math.max(pausedUntil, Date.now() + resetMs);
    }
    return response;
  };

  const nextWait = () => Math.max(0, delayMs - (Date.now() - lastTime), pausedUntil - Date.now());

  const dispatch = () => {
    timer = undefined;
    // A pause that started after this timer was set moves the start back.
    if (nextWait() > 0) return schedule();
    const item = queue.shift();
    if (!item) return;
    if (item.onAbort) item.signal?.removeEventListener("abort", item.onAbort);
    lastTime = Date.now();
    // A fetch that throws synchronously rejects this item instead of escaping the queue.
    // cast to any to satisfy overloads on fetch implementations
    Promise.resolve()
      .then(() => f(item.args[0] as any, item.args[1]))
      .then(observe)
      .then(item.resolve, item.reject);
    schedule();
  };

  const schedule = () => {
    if (timer !== undefined || queue.length === 0) return;
    const wait = nextWait();
    if (wait === 0) dispatch();
    else timer = setTimeout(dispatch, wait);
  };

  return ((input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((resolve, reject) => {
      const signal = getFetchSignal(input, init);
      if (signal?.aborted) return reject(signal.reason);
      const item: QueueItem = { args: [input, init], resolve, reject, signal };
      if (signal) {
        item.onAbort = () => {
          const index = queue.indexOf(item);
          if (index === -1) return;
          queue.splice(index, 1);
          // Nothing is left to start, so the timer must not keep a Node process alive.
          if (queue.length === 0 && timer !== undefined) {
            clearTimeout(timer);
            timer = undefined;
          }
          reject(signal.reason);
        };
        signal.addEventListener("abort", item.onAbort, { once: true });
      }
      queue.push(item);
      schedule();
    })) as unknown as typeof fetch;
}

/**
 * Abort a request whose response headers have not arrived after `timeoutMs`. The
 * abort reason is a `TimeoutError`, which the retry layer treats as transient; an
 * abort from the caller's own signal is passed through and not retried.
 */
function createTimeoutFetch(origFetch: typeof fetch, timeoutMs: number | undefined): typeof fetch {
  if (typeof timeoutMs !== "number" || !Number.isFinite(timeoutMs) || timeoutMs <= 0) return origFetch;

  return ((input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController();
    const outer = getFetchSignal(input, init);
    const onAbort = () => controller.abort(outer!.reason);
    if (outer?.aborted) onAbort();
    else outer?.addEventListener("abort", onAbort, { once: true });
    const timer = setTimeout(
      () => controller.abort(new DOMException(`Request timed out after ${timeoutMs} ms`, "TimeoutError")),
      timeoutMs
    );
    return Promise.resolve()
      .then(() => origFetch(input as any, { ...init, signal: controller.signal } as any))
      .then(
        (response) => {
          // Only the timeout ends with the headers. The caller's signal stays linked, so an
          // abort while the body is read still cancels the request. That signal is tRPC's
          // own, made for this batch, so the listener goes away with it.
          clearTimeout(timer);
          return response;
        },
        (error) => {
          clearTimeout(timer);
          outer?.removeEventListener("abort", onAbort);
          throw error;
        }
      );
  }) as unknown as typeof fetch;
}

function sleep(ms: number, signal?: AbortSignal | null) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal!.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Milliseconds the server asks to wait, from `Retry-After` (seconds or an HTTP date)
 * or, for a 429, `ratelimit-reset` (seconds). The API sends `ratelimit-reset` with
 * every response, so it only says something about the wait on a 429. `null` when
 * neither is usable.
 */
function getServerRetryDelayMs(response: Response): number | null {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
    const date = Date.parse(retryAfter);
    if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  }
  const reset = response.headers.get("ratelimit-reset");
  if (response.status !== 429 || reset === null || !Number.isFinite(Number(reset))) return null;
  return Math.max(0, Number(reset) * 1000);
}

function isAbortError(error: unknown, signal?: AbortSignal | null) {
  return Boolean(signal?.aborted) ||
    (typeof error === "object" && error !== null && (error as { name?: unknown }).name === "AbortError");
}

function normalizeNonNegativeInteger(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

function normalizePositiveNumber(value: number | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(1, value);
}

function normalizeMaxBatchSize(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return MAX_MAX_BATCH_SIZE;
  }

  return Math.min(MAX_MAX_BATCH_SIZE, Math.max(1, Math.floor(value)));
}

function normalizeRetryOptions(retry: TrpcLikeClientOptions["retry"]): NormalizedRetryOptions | null {
  if (retry === false) return null;

  const options = retry === true || retry === undefined ? {} : retry;
  const retryableStatusCodes =
    options.retryableStatusCodes && options.retryableStatusCodes.length > 0
      ? options.retryableStatusCodes
      : DEFAULT_RETRYABLE_STATUS_CODES;

  return {
    maxRetries: normalizeNonNegativeInteger(options.maxRetries, 3),
    initialDelayMs: normalizePositiveNumber(options.initialDelayMs, 250),
    maxDelayMs: normalizePositiveNumber(options.maxDelayMs, 5000),
    backoffMultiplier: normalizePositiveNumber(options.backoffMultiplier, 2),
    jitter: options.jitter ?? true,
    retryableStatusCodes: new Set(retryableStatusCodes),
    onRetry: options.onRetry,
  };
}

function getFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === "string" || input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

function getFetchSignal(input: RequestInfo | URL, init?: RequestInit): AbortSignal | null | undefined {
  return init?.signal ?? (typeof Request !== "undefined" && input instanceof Request ? input.signal : undefined);
}

function getFetchMethod(input: RequestInfo | URL, init?: RequestInit): string {
  const isRequest = typeof Request !== "undefined" && input instanceof Request;
  return (init?.method ?? (isRequest ? input.method : "GET")).toUpperCase();
}

function getRetryDelayMs(options: NormalizedRetryOptions, attempt: number) {
  const exponentialDelay =
    options.initialDelayMs * Math.pow(options.backoffMultiplier, Math.max(0, attempt - 1));
  const cappedDelay = Math.min(options.maxDelayMs, exponentialDelay);
  if (!options.jitter) return Math.round(cappedDelay);

  const jitterMultiplier = 0.5 + Math.random();
  return Math.round(Math.min(options.maxDelayMs, cappedDelay * jitterMultiplier));
}

function getErrorReason(error: unknown): string {
  if (error && typeof error === "object") {
    const code = "code" in error ? String((error as { code?: unknown }).code) : "";
    const message = "message" in error ? String((error as { message?: unknown }).message) : "";

    const cause = "cause" in error ? (error as { cause?: unknown }).cause : undefined;
    const causeCode =
      cause && typeof cause === "object" && "code" in cause
        ? String((cause as { code?: unknown }).code)
        : "";

    return [code, causeCode, message].filter(Boolean).join(": ") || "fetch failed";
  }

  return typeof error === "string" ? error : "fetch failed";
}

function isReplayableRequest(input: RequestInfo | URL, init?: RequestInit) {
  if (typeof ReadableStream !== "undefined" && init?.body instanceof ReadableStream) {
    return false;
  }

  const isRequest = typeof Request !== "undefined" && input instanceof Request;
  if (!isRequest) return true;

  if (init?.body !== undefined) return true;

  return input.body === null;
}

/**
 * Wrap fetch with retries for transient transport failures. Since tRPC batches
 * are a single HTTP request, replaying fetch retries the whole failed batch.
 *
 * @internal
 */
export function createRetryFetch(origFetch: typeof fetch, retry?: TrpcLikeClientOptions["retry"]): typeof fetch {
  const options = normalizeRetryOptions(retry);
  if (!options || options.maxRetries === 0) return origFetch;

  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const canRetry = isReplayableRequest(input, init);
    const method = getFetchMethod(input, init);
    const url = getFetchUrl(input);
    const signal = getFetchSignal(input, init);
    let attempt = 0;

    while (true) {
      let response: Response;
      try {
        response = await origFetch(input as any, init as any);
      } catch (error) {
        if (!canRetry || attempt >= options.maxRetries || isAbortError(error, signal)) {
          throw error;
        }

        const nextAttempt = attempt + 1;
        const delayMs = getRetryDelayMs(options, nextAttempt);
        options.onRetry?.({
          attempt: nextAttempt,
          maxRetries: options.maxRetries,
          delayMs,
          method,
          url,
          reason: getErrorReason(error),
          error,
        });
        await sleep(delayMs, signal);
        attempt = nextAttempt;
        continue;
      }

      if (
        canRetry &&
        attempt < options.maxRetries &&
        options.retryableStatusCodes.has(response.status)
      ) {
        const nextAttempt = attempt + 1;
        const serverDelayMs = RATE_LIMIT_STATUS_CODES.has(response.status) ? getServerRetryDelayMs(response) : null;
        // Retrying before the server's window resets would only spend the remaining attempts.
        if (serverDelayMs !== null && serverDelayMs > options.maxDelayMs) return response;
        const delayMs = Math.max(getRetryDelayMs(options, nextAttempt), serverDelayMs ?? 0);
        await response.body?.cancel().catch(() => undefined);
        options.onRetry?.({
          attempt: nextAttempt,
          maxRetries: options.maxRetries,
          delayMs,
          method,
          url,
          reason: `HTTP ${response.status}`,
          status: response.status,
        });
        await sleep(delayMs, signal);
        attempt = nextAttempt;
        continue;
      }

      return response;
    }
  }) as unknown as typeof fetch;
}

function createBatchLoggingFetch(
  origFetch: typeof fetch,
  logBatches?: boolean | ((info: BatchLogInfo) => void)
): typeof fetch {
  if (!logBatches) return origFetch;
  const logFn =
    typeof logBatches === "function"
      ? logBatches
      : (info: BatchLogInfo) => {
          console.log("[trpc-batch]", info);
        };

  return ((input: RequestInfo | URL, init?: RequestInit) => {
    const urlString = getFetchUrl(input);

    try {
      const urlObj = new URL(urlString);
      const path = urlObj.pathname;
      const lastSegment = path.split("/").pop() ?? "";
      const paths = lastSegment.split(",").filter(Boolean);
      const isBatch = urlObj.searchParams.get("batch") === "1" || paths.length > 1;

      if (isBatch) {
        const body = typeof init?.body === "string" ? init.body : undefined;
        logFn({
          method: getFetchMethod(input, init),
          url: urlObj.toString(),
          path: lastSegment,
          paths,
          batchSize: paths.length,
          body,
        });
      }
    } catch {
      // ignore URL parse issues
    }

    return origFetch(input as any, init as any);
  }) as unknown as typeof fetch;
}

/** A tRPC error item for a batch whose response was not JSON. */
function createBatchErrorItem(response: Response, paths: string[]) {
  const tooManyRequests = response.status === 429;
  return {
    error: {
      message: `HTTP ${response.status} ${response.statusText}`.trim() + ` for ${paths.join(",")}`,
      code: tooManyRequests ? -32029 : -32603,
      data: {
        code: tooManyRequests ? "TOO_MANY_REQUESTS" : "INTERNAL_SERVER_ERROR",
        httpStatus: response.status,
      },
    },
  };
}

/**
 * Turn a response that is not JSON, such as a proxy's HTML error page, into tRPC error
 * items, so the calls fail with the HTTP status instead of a JSON parse error. Each
 * `maxItems` batch is its own request, so only that batch's calls fail.
 */
function createJsonErrorFetch(origFetch: typeof fetch): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await origFetch(input as any, init as any);
    // A successful JSON response is passed on unread. An error response is checked
    // whatever its content type says: a gateway can label an HTML page as JSON.
    if (response.ok && response.headers.get("content-type")?.includes("json")) return response;

    const text = await response.text();
    try {
      JSON.parse(text);
      return new Response(text, response);
    } catch {
      // The base is only used for a relative `url` option, which a browser resolves itself.
      const url = new URL(getFetchUrl(input), "http://localhost");
      const paths = (url.pathname.split("/").pop() ?? "").split(",").filter(Boolean);
      const item = createBatchErrorItem(response, paths);
      const body = url.searchParams.get("batch") === "1" ? paths.map(() => item) : item;
      return new Response(JSON.stringify(body), {
        status: response.status,
        statusText: response.statusText,
        headers: { "content-type": "application/json" },
      });
    }
  }) as unknown as typeof fetch;
}

/**
 * Make a call reject as soon as its own signal aborts. tRPC cancels a batch's HTTP
 * request only once every call in the batch has been aborted; until then a call that
 * was aborted on its own would still resolve with its result. A call whose signal is
 * already aborted is not handed to tRPC at all.
 */
function createAbortableQuery(query: UntypedClient["query"]): UntypedClient["query"] {
  return (path, input, opts) => {
    const signal = opts?.signal;
    if (!signal) return query(path, input, opts);
    if (signal.aborted) return Promise.reject(TRPCClientError.from(signal.reason));

    return new Promise((resolve, reject) => {
      const onAbort = () => reject(TRPCClientError.from(signal.reason));
      signal.addEventListener("abort", onAbort, { once: true });
      query(path, input, opts)
        .then(resolve, reject)
        .finally(() => signal.removeEventListener("abort", onAbort));
    });
  };
}

/**
 * Create a typed API client backed by an untyped @trpc/client.
 *
 * The returned value is a proxy that supports nested property access and function
 * invocation to call remote procedures. For example:
 *
 * ```ts
 * const client = createAPIClient();
 * const result = await client.article.getArticleById({ articleId: "article-id" });
 * ```
 *
 * Internally each invocation builds a dot-joined path from the accessed properties
 * (e.g. `article.getArticleById`) and calls the underlying client's `query(path, input)`.
 *
 * @param options - Configuration options for the API client
 * @param options.url - The base URL used by the HTTP batch link; defaults to https://api2.warera.io/trpc
 * @param options.apiKey - Optional API key to include as `x-api-key` header
 * @param options.logger - Pass `true` to add `loggerLink`; disabled by default
 * @param options.fetch - Optional fetch implementation to use for requests
 * @param options.headers - Additional headers to include on every request
 * @param options.rateLimit - Requests per minute; without it the client starts at 200 with a non-empty API key, otherwise 100, and follows the server's limit
 * @param options.timeoutMs - Abort and retry an HTTP request without response headers after this many milliseconds; off by default
 * @param options.maxBatchSize - Maximum operations per HTTP batch; defaults to and is capped at 50. Set to `1` to disable batching.
 * @param options.batchIntervalMs - Deprecated and unused; tRPC's `httpBatchLink` batches calls made in the same tick
 * @param options.retry - Retry transient failures; enabled by default with up to 3 retries, or pass `false` to disable
 * @param options.logBatches - Pass `true` to log HTTP batches or provide a callback; disabled by default
 * @param options.voidInputProcedures - Additional procedure paths that must receive no input instead of `{}`
 * @returns An `APIClient` proxy with typed nested procedure calls and optional auto-pagination
 */
export function createAPIClient(options?: TrpcLikeClientOptions): APIClient {
  const appliedRateLimit = options?.rateLimit ?? (options?.apiKey ? 200 : 100);
  const baseFetch = options?.fetch ?? (globalThis as any).fetch;
  const loggedFetch = createBatchLoggingFetch(baseFetch, options?.logBatches);
  // Inside the rate limiter, so the time a request waits in the queue does not count.
  const timeoutFetch = createTimeoutFetch(loggedFetch, options?.timeoutMs);
  const rateLimitedFetch = createRateLimitedFetch(timeoutFetch, appliedRateLimit, options?.rateLimit === undefined);
  const retryFetch = createRetryFetch(rateLimitedFetch, options?.retry);
  const jsonErrorFetch = createJsonErrorFetch(retryFetch);
  const responseTypes = getResponseStatusCodes();
  const voidInputProcedures = new Set([
    ...VOID_INPUT_PROCEDURES,
    ...(options?.voidInputProcedures ?? []),
  ]);
  
  const trpc = createTRPCUntypedClient({
    links: [
      ...(options?.logger === true ? [loggerLink()] : []),
      httpBatchLink({
        url: options?.url ?? "https://api2.warera.io/trpc",
        fetch: jsonErrorFetch,
        maxItems: normalizeMaxBatchSize(options?.maxBatchSize),
        // Queries go out as POST with the input in the body, so long inputs never hit a URL limit.
        methodOverride: "POST",
        headers() {
          return {
            ...(options?.headers ?? {}),
            ...(options?.apiKey ? { "x-api-key": options.apiKey } : {}),
            ...({ "rt" : responseTypes })
          };
        }
      })
    ]
  }) as unknown as UntypedClient;
  const client: UntypedClient = {
    query: createAbortableQuery((path, input, opts) => trpc.query(path, input, opts)),
  };

  const makeProxy = (parts: string[]): any =>
    new Proxy(() => {}, {
      get(_t, prop) {
        // `then` makes the client look like a promise to `await` and `Promise.resolve`.
        if (typeof prop !== "string" || prop === "then") return undefined;
        if (prop === "_ce" && parts.length === 0) {
          // Runtime noop: custom endpoint typing is compile-time only.
          return () => makeProxy([]);
        }
        return makeProxy([...parts, prop]);
      },
      apply(_t, _thisArg, argArray) {
        const path = parts.join(".");
        const signal: AbortSignal | undefined = argArray?.[1]?.signal;
        const requestOptions = signal ? { signal } : undefined;
        // Void-input procedures reject `{}`; everything else gets `{}` as the default input.
        const input = voidInputProcedures.has(path)
          ? argArray?.[0]
          : argArray?.[0] ?? {};

        // Check if auto-pagination is requested
        if (input?.autoPaginate === true) {
          const { autoPaginate: _unused, maxPages, cursorEnd, ...cleanedInput } = input;
          return autoPaginate(client, path, cleanedInput, {
            maxPages,
            cursorEnd,
            signal,
          });
        }
        
        // Regular query. The client-only pagination options are removed from plain-object inputs;
        // anything else (class instances, objects with toJSON) goes to tRPC unchanged.
        if (
          input !== null && typeof input === "object" && !Array.isArray(input) &&
          (Object.getPrototypeOf(input) === Object.prototype || Object.getPrototypeOf(input) === null) &&
          typeof input.toJSON !== "function" &&
          ("autoPaginate" in input || "maxPages" in input || "cursorEnd" in input)
        ) {
          const { autoPaginate: _unused, maxPages: _maxPages, cursorEnd: _cursorEnd, ...cleanedInput } = input;
          return client.query(path, cleanedInput, requestOptions);
        }
        return client.query(path, input, requestOptions);
      }
    });

  return makeProxy([]) as APIClient;
}
