export type { components, operations, paths } from "./api/warera-openapi";
export { createTrpcClient } from "./trpc-client";
export type { TrpcClientOptions } from "./trpc-client";
export { createTrpcLikeClient } from "./trpc-proxy-client";
export type { TrpcLikeClientOptions } from "./trpc-proxy-client";
export type { InputFor, ProcedureKey, ResponseFor, TrpcLikeClient } from "./typed-procedures";

