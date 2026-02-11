import { createTRPCProxyClient, httpBatchLink, loggerLink, TRPCLink } from "@trpc/client";
import type { AnyRouter } from "@trpc/server";

export interface TrpcClientOptions<TRouter extends AnyRouter> {
  url: string;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
  apiKey?: string;
  logger?: boolean;

  // IMPORTANT: match server router transformer
  transformer: TRouter["_def"]["_config"]["transformer"];
}

export function createTrpcClient<TRouter extends AnyRouter>(
  options: TrpcClientOptions<TRouter>
) {
  const links: TRPCLink<TRouter>[] = [];

  if (options.logger !== false) {
    links.push(loggerLink<TRouter>());
  }

  links.push(
    httpBatchLink<TRouter>({
      url: options.url,
      fetch: options.fetch,
      headers() {
        return {
          ...(options.headers ?? {}),
          ...(options.apiKey ? { "x-api-key": options.apiKey } : {}),
        };
      },
    })
  );

  return createTRPCProxyClient<TRouter>({
    links,
    transformer: options.transformer,
  });
}