import type { Responses } from "./api/Responses";
import type { operations } from "./api/warera-openapi";
import type { WarEraCustomEndpoints } from "./CustomEndpoints";

export type ProcedureKey = keyof operations;

type JsonContent<T> = T extends { content: { "application/json": infer C } }
  ? C
  : never;

export type PaginationOptions = {
  autoPaginate?: boolean;
  maxPages?: number;
  cursorEnd?: Date;
};

export type CustomEndpointDefinition<Input = never, Output = unknown> = {
  output: Output;
  input?: Input;
};

export type CustomEndpointMap = Record<string, CustomEndpointDefinition<any, any>>;

type BaseInputFor<K extends ProcedureKey> = operations[K] extends {
  requestBody?: infer RB;
}
  ? JsonContent<RB>
  : never;

// Auto-detect if endpoint supports pagination: check if input has "cursor" property
type IsPaginatedResponse<K extends ProcedureKey> = BaseInputFor<K> extends { cursor?: any }
  ? true
  : false;

type ExtractItems<T> = T extends { items: infer I }
  ? I extends Array<infer Item>
    ? Item
    : never
  : never;

export type InputFor<K extends ProcedureKey> = IsPaginatedResponse<K> extends true
  ? BaseInputFor<K> & Partial<PaginationOptions>
  : BaseInputFor<K>;

type ResponseFromOpenApi<K extends ProcedureKey> = operations[K] extends {
  responses: { 200: infer R };
}
  ? JsonContent<R> extends never
    ? unknown
    : JsonContent<R>
  : unknown;

export type ResponseFor<K extends ProcedureKey> = K extends keyof Responses
  ? Responses[K]
  : ResponseFromOpenApi<K>;

export type PageResultFromOutput<TOutput> = {
  items: ExtractItems<TOutput>[];
  cursor: string;
};

export type PageResult<K extends ProcedureKey> = {
  items: ExtractItems<ResponseFor<K>>[];
  cursor: string;
};

export type TrpcProcedure<K extends ProcedureKey> = {
  key: K;
};

type Split<S extends string, D extends string> = S extends `${infer A}${D}${infer B}`
  ? [A, ...Split<B, D>]
  : [S];

type UnionToIntersection<U> = (
  U extends unknown ? (x: U) => void : never
) extends (x: infer I) => void
  ? I
  : never;

type MergeDeep<T> = { [K in keyof T]: T[K] };

// Helper type to check if a type is exactly `never`
type IsNever<T> = [T] extends [never] ? true : false;

// Helper type to check if all properties in a type are optional.
// `{}` is assignable to T exactly when T has no required property. The previous
// form, `Required<T> extends T`, is true for every object type, which made every
// procedure input optional.
type AllPropertiesOptional<T> = {} extends T ? true : false;

type EndpointDefinition<RawInput, Output> = {
  input: RawInput;
  output: Output;
};

type BuiltInEndpointDefinitions = {
  [K in ProcedureKey]: EndpointDefinition<BaseInputFor<K>, ResponseFor<K>>;
};

type NormalizeCustomEndpointMap<TCustom extends CustomEndpointMap> = {
  [K in keyof TCustom & string]: TCustom[K] extends {
    output: infer Output;
    input: infer Input;
  }
    ? EndpointDefinition<Input, Output>
    : TCustom[K] extends { output: infer Output }
    ? EndpointDefinition<never, Output>
    : never;
};

type IsPaginatedInput<RawInput> = RawInput extends { cursor?: any } ? true : false;

type InputForDefinition<RawInput> = IsPaginatedInput<RawInput> extends true
  ? RawInput & Partial<PaginationOptions>
  : RawInput;

type HasRequiredInputForDefinition<RawInput> = IsNever<RawInput> extends true
  ? false
  : AllPropertiesOptional<RawInput> extends true
  ? false
  : true;

type ProcedureFunctionFromDefinition<
  Def extends EndpointDefinition<any, any>
> = HasRequiredInputForDefinition<Def["input"]> extends true
  ? IsPaginatedInput<Def["input"]> extends true
    ? {
        (
          input: InputForDefinition<Def["input"]> & {
            autoPaginate?: false | undefined;
          }
        ): Promise<Def["output"]>;
        (
          input: InputForDefinition<Def["input"]> & { autoPaginate: true }
        ): AsyncIterableIterator<PageResultFromOutput<Def["output"]>>;
      }
    : (input: InputForDefinition<Def["input"]>) => Promise<Def["output"]>
  : IsPaginatedInput<Def["input"]> extends true
  ? {
      (
        input?: InputForDefinition<Def["input"]> & {
          autoPaginate?: false | undefined;
        }
      ): Promise<Def["output"]>;
      (
        input?: InputForDefinition<Def["input"]> & { autoPaginate: true }
      ): AsyncIterableIterator<PageResultFromOutput<Def["output"]>>;
    }
  : (input?: InputForDefinition<Def["input"]>) => Promise<Def["output"]>;

type BuildPath<
  Parts extends string[],
  K extends string,
  Definitions extends Record<string, EndpointDefinition<any, any>>
> = Parts extends [
  infer H extends string,
  ...infer R extends string[]
]
  ? R["length"] extends 0
    ? { [P in H]: ProcedureFunctionFromDefinition<Definitions[K]> }
    : { [P in H]: BuildPath<R, K, Definitions> }
  : never;

type TreeFromDefinitions<
  Definitions extends Record<string, EndpointDefinition<any, any>>,
  Keys extends keyof Definitions & string = keyof Definitions & string
> = UnionToIntersection<
  Keys extends string
    ? BuildPath<Split<Extract<Keys, string>, ".">, Keys, Definitions>
    : never
>;

type PackagedCustomEndpointDefinitions = NormalizeCustomEndpointMap<WarEraCustomEndpoints>;

type DefaultEndpointDefinitions =
  BuiltInEndpointDefinitions & PackagedCustomEndpointDefinitions;

type DefaultClientTree = MergeDeep<TreeFromDefinitions<DefaultEndpointDefinitions>>;

export type APIClientWithCustomEndpoints<TCustom extends CustomEndpointMap> =
  MergeDeep<
    TreeFromDefinitions<
      DefaultEndpointDefinitions & NormalizeCustomEndpointMap<TCustom>
    >
  > & {
    _ce: <TAdditional extends CustomEndpointMap>() => APIClientWithCustomEndpoints<
      TCustom & TAdditional
    >;
  };

export type APIClient = DefaultClientTree & {
  _ce: <TCustom extends CustomEndpointMap>() => APIClientWithCustomEndpoints<TCustom>;
};

export function procedure<K extends ProcedureKey>(key: K): TrpcProcedure<K> {
  return { key };
}

export async function trpcQuery<K extends ProcedureKey>(
  client: { query: (path: K, input: InputFor<K>) => Promise<ResponseFor<K>> },
  proc: TrpcProcedure<K>,
  input?: InputFor<K>
) {
  return client.query(proc.key, input ?? ({} as InputFor<K>));
}
