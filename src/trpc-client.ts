import { createTRPCUntypedClient, httpBatchLink, loggerLink } from "@trpc/client";
import type { APIClient, PageResult, ProcedureKey } from "./typed-procedures";

export interface TrpcLikeClientOptions {
  url?: string;
  apiKey?: string;
  logger?: boolean;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
  maxBatchSize?: number;
  batchIntervalMs?: number;
  logBatches?: boolean | ((info: BatchLogInfo) => void);
  retry?: boolean | RetryOptions;
}

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
   * Maximum retry delay in milliseconds. Defaults to 5000ms.
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
  query: (path: string, input: unknown) => Promise<unknown>;
};

const MAX_MAX_BATCH_SIZE = 50;
const DEFAULT_RETRYABLE_STATUS_CODES = [408, 409, 425, 429, 500, 502, 503, 504];

function getResponseStatusCodes() {
  return DEFAULT_RETRYABLE_STATUS_CODES
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

/**
 * Parse the date from a cursor string in the format "{date}|{id}".
 * Returns null if the cursor is invalid, empty, or the date cannot be parsed.
 */
function parseCursorDate(cursor: string | null | undefined): Date | null {
  if (!cursor || typeof cursor !== "string") return null;
  
  const pipeIndex = cursor.indexOf("|");
  if (pipeIndex === -1) return null;
  
  const dateStr = cursor.substring(0, pipeIndex);
  if (dateStr === 'undefined') return null;
  try {
    const date = new Date(dateStr);
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
  options: { maxPages?: number; cursorEnd?: Date }
): AsyncIterableIterator<PageResult<K>> {
  let currentCursor: string | undefined = input.cursor as string | undefined;
  let pageCount = 0;
  const maxPages = options.maxPages ?? Infinity;

  while (pageCount < maxPages) {
    // Make the request with the current cursor
    const requestInput = currentCursor ? { ...input, cursor: currentCursor } : input;
    const response = (await client.query(path, requestInput)) as {
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
    if (options.cursorEnd) {
      const cursorDate = parseCursorDate(response.nextCursor);
      if (cursorDate && cursorDate < options.cursorEnd) {
        break; // Next cursor is older than cutoff date
      }
    }

    currentCursor = response.nextCursor;
  }
}

function createRateLimitedFetch(origFetch?: typeof fetch, rateLimit = 100): typeof fetch {
  const f: typeof fetch = origFetch ?? (globalThis as any).fetch;
  const delayMs = Math.max(1, Math.floor(60000 / rateLimit));

  type QueueItem = {
    args: [RequestInfo | URL, RequestInit | undefined];
    resolve: (r: Response | PromiseLike<Response>) => void;
    reject: (e: unknown) => void;
  };

  const queue: QueueItem[] = [];
  let running = false;
  let lastTime = 0;

  const runNext = async () => {
    if (queue.length === 0) {
      running = false;
      return;
    }
    running = true;
    const now = Date.now();
    const elapsed = now - lastTime;
    const wait = Math.max(0, delayMs - elapsed);
    if (wait > 0) await new Promise((res) => setTimeout(res, wait));

    const item = queue.shift()!;
    lastTime = Date.now();
    // cast to any to satisfy overloads on fetch implementations
    f(item.args[0] as any, item.args[1])
      .then(item.resolve)
      .catch(item.reject)
      .finally(() => {
        if (queue.length > 0) {
          setTimeout(runNext, 0);
        } else {
          running = false;
        }
      });
  };

  return ((input: RequestInfo | URL, init?: RequestInit) =>
    new Promise<Response>((resolve, reject) => {
      queue.push({ args: [input, init], resolve, reject });
      if (!running) runNext();
    })) as unknown as typeof fetch;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    let attempt = 0;

    while (true) {
      try {
        const response = await origFetch(input as any, init as any);

        if (
          canRetry &&
          attempt < options.maxRetries &&
          options.retryableStatusCodes.has(response.status)
        ) {
          const nextAttempt = attempt + 1;
          const delayMs = getRetryDelayMs(options, nextAttempt);
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
          await sleep(delayMs);
          attempt = nextAttempt;
          continue;
        }

        return response;
      } catch (error) {
        if (!canRetry || attempt >= options.maxRetries) {
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
        await sleep(delayMs);
        attempt = nextAttempt;
      }
    }
  }) as unknown as typeof fetch;
}

function createPostQueryFetch(origFetch?: typeof fetch): typeof fetch {
  const f: typeof fetch = origFetch ?? (globalThis as any).fetch;

  return ((input: RequestInfo | URL, init?: RequestInit) => {
    const isRequest =
      typeof Request !== "undefined" && input instanceof Request;
    const method = getFetchMethod(input, init);

    if (method !== "GET") {
      return f(input as any, init as any);
    }

    const urlString =
      typeof input === "string" || input instanceof URL
        ? input.toString()
        : input.url;

    let urlObj: URL;
    try {
      urlObj = new URL(urlString);
    } catch {
      return f(input as any, init as any);
    }

    const inputParam = urlObj.searchParams.get("input");
    if (!inputParam) {
      return f(input as any, init as any);
    }

    urlObj.searchParams.delete("input");

    const headers = new Headers(isRequest ? input.headers : undefined);
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    const nextInit: RequestInit = {
      ...init,
      method: "POST",
      headers,
      body: inputParam,
    };

    return f(urlObj.toString(), nextInit as any);
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
    const urlString =
      typeof input === "string" || input instanceof URL
        ? input.toString()
        : input.url;

    try {
      const urlObj = new URL(urlString);
      const path = urlObj.pathname;
      const lastSegment = path.split("/").pop() ?? "";
      const paths = lastSegment.split(",").filter(Boolean);
      const isBatch = urlObj.searchParams.get("batch") === "1" || paths.length > 1;

      if (isBatch) {
        const body = typeof init?.body === "string" ? init.body : undefined;
        logFn({
          method: (init?.method ?? (input as Request).method ?? "GET").toUpperCase(),
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

function splitInputByBatch(
  input: Record<string, unknown> | null,
  startIndex: number,
  chunkSize: number
) {
  if (!input) return null;

  const chunkInput: Record<number, unknown> = {};
  for (let index = 0; index < chunkSize; index++) {
    chunkInput[index] = input[startIndex + index];
  }
  return chunkInput;
}

function parseBatchInput(input: string | null) {
  if (!input) return null;

  try {
    const parsed = JSON.parse(input);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function createBatchChunkUrl(urlObj: URL, startIndex: number, chunkPaths: string[]) {
  const chunkUrl = new URL(urlObj.toString());
  const slashIndex = chunkUrl.pathname.lastIndexOf("/");
  const prefix = slashIndex === -1 ? "" : chunkUrl.pathname.slice(0, slashIndex + 1);
  chunkUrl.pathname = `${prefix}${chunkPaths.join(",")}`;

  const queryInput = parseBatchInput(urlObj.searchParams.get("input"));
  const chunkInput = splitInputByBatch(queryInput, startIndex, chunkPaths.length);
  if (chunkInput) {
    chunkUrl.searchParams.set("input", JSON.stringify(chunkInput));
  }

  return chunkUrl;
}

function createBatchChunkInit(init: RequestInit | undefined, bodyInput: Record<string, unknown> | null, startIndex: number, chunkSize: number) {
  const chunkInput = splitInputByBatch(bodyInput, startIndex, chunkSize);
  if (!chunkInput) return init;

  return {
    ...init,
    body: JSON.stringify(chunkInput),
  };
}

function createMaxBatchSizeFetch(origFetch: typeof fetch, maxBatchSize: number): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlString = getFetchUrl(input);
    let urlObj: URL;

    try {
      urlObj = new URL(urlString);
    } catch {
      return origFetch(input as any, init as any);
    }

    if (urlObj.searchParams.get("batch") !== "1") {
      return origFetch(input as any, init as any);
    }

    const lastSegment = urlObj.pathname.split("/").pop() ?? "";
    const paths = lastSegment.split(",").filter(Boolean);
    if (paths.length <= maxBatchSize) {
      return origFetch(input as any, init as any);
    }

    const bodyInput = typeof init?.body === "string" ? parseBatchInput(init.body) : null;
    const combinedJSON: unknown[] = [];
    let status = 200;
    let statusText = "OK";

    for (let startIndex = 0; startIndex < paths.length; startIndex += maxBatchSize) {
      const chunkPaths = paths.slice(startIndex, startIndex + maxBatchSize);
      const chunkUrl = createBatchChunkUrl(urlObj, startIndex, chunkPaths);
      const chunkInit = createBatchChunkInit(init, bodyInput, startIndex, chunkPaths.length);
      const response = await origFetch(chunkUrl.toString(), chunkInit as any);

      if (!response.ok && status === 200) {
        status = response.status;
        statusText = response.statusText;
      }

      const json = await response.json();
      if (Array.isArray(json)) {
        combinedJSON.push(...json);
      } else {
        combinedJSON.push(...chunkPaths.map(() => json));
      }
    }

    return new Response(JSON.stringify(combinedJSON), {
      status,
      statusText,
      headers: {
        "content-type": "application/json",
      },
    });
  }) as unknown as typeof fetch;
}

/**
 * Create a lightweight TRPC-like client proxy backed by an untyped @trpc/client.
 *
 * The returned value is a proxy that supports nested property access and function
 * invocation to call remote procedures. For example:
 *
 * ```ts
 * const client = createAPIClient({ url: 'https://api.example' });
 * const result = await client.article.getById({ id: 1 });
 * ```
 *
 * Internally each invocation builds a dot-joined path from the accessed properties
 * (e.g. `article.getById`) and calls the underlying client's `query(path, input)`.
 *
 * @param options - Configuration options for the TRPC-like client
 * @param options.url - The base URL used by the HTTP batch link
 * @param options.apiKey - Optional API key to include as `x-api-key` header
 * @param options.logger - Pass `false` to disable the `loggerLink`
 * @param options.fetch - Optional fetch implementation to use for requests
 * @param options.headers - Additional headers to include on every request
 * @param options.rateLimit - Set the rate limit for requests per minute. Defaults to `200` if API key provided, otherwise default to 100
 * @param options.maxBatchSize - Max number of operations per HTTP batch. Set to `1` to disable batching.
 * @param options.batchIntervalMs - Time window to batch operations before sending.
 * @returns A `TrpcLikeClient` proxy which can be invoked like `client.foo.bar(input)`
 */
export function createAPIClient(options?: TrpcLikeClientOptions & {rateLimit?: number}): APIClient {
  const appliedRateLimit = options?.rateLimit ?? (options?.apiKey !== undefined ? 200 : 100);
  const baseFetch = options?.fetch ?? (globalThis as any).fetch;
  const loggedFetch = createBatchLoggingFetch(baseFetch, options?.logBatches);
  const postQueryFetch = createPostQueryFetch(loggedFetch);
  const rateLimitedFetch = createRateLimitedFetch(postQueryFetch, appliedRateLimit);
  const retryFetch = createRetryFetch(rateLimitedFetch, options?.retry);
  const maxBatchSize = normalizeMaxBatchSize(options?.maxBatchSize);
  const maxBatchSizeFetch = createMaxBatchSizeFetch(retryFetch, maxBatchSize);
  const responseTypes = getResponseStatusCodes();
  
  const client = createTRPCUntypedClient({
    links: [
      ...(options?.logger === true ? [loggerLink()] : []),
      httpBatchLink({
        url: options?.url ?? "https://api2.warera.io/trpc",
        fetch: maxBatchSizeFetch,
        maxURLLength: 16000,
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

  const makeProxy = (parts: string[]): any =>
    new Proxy(() => {}, {
      get(_t, prop) {
        if (typeof prop !== "string") return undefined;
        if (prop === "_ce" && parts.length === 0) {
          // Runtime noop: custom endpoint typing is compile-time only.
          return () => makeProxy([]);
        }
        return makeProxy([...parts, prop]);
      },
      apply(_t, _thisArg, argArray) {
        const path = parts.join(".");
        // This procedure validates void input and rejects an empty object.
        const input = path === "gameStat.getWorldDevelopment"
          ? argArray?.[0]
          : argArray?.[0] ?? {};
        
        // Check if auto-pagination is requested
        if (input?.autoPaginate === true) {
          const { autoPaginate: _unused, maxPages, cursorEnd, ...cleanedInput } = input;
          return autoPaginate(client, path, cleanedInput, {
            maxPages,
            cursorEnd,
          });
        }
        
        // Regular query
        return client.query(path, input);
      }
    });

  return makeProxy([]) as APIClient;
}
