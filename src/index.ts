export type * from './api/Responses';
export type { components, operations, paths } from "./api/warera-openapi";
export type * from "./CustomEndpoints";
export {
    createAPIClient,
    /**
     * @deprecated Use createAPIClient instead
     */
    createAPIClient as createTrpcLikeClient,
    VOID_INPUT_PROCEDURES
} from "./trpc-client";
export type {
    TrpcLikeClientOptions as APIClientOptions,
    /**
     * @deprecated Use APIClientOptions instead
     */
    TrpcLikeClientOptions,
    RetryInfo,
    RetryOptions
} from "./trpc-client";
export type * from "./typed-procedures";

