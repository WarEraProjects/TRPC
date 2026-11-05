import type { operations as Operations } from "../../src/api/warera-openapi";

export type OperationKey = keyof Operations;

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type CollectedIds = {
  countryId?: string;
  userId?: string;
  regionId?: string;
  companyId?: string;
  battleId?: string;
  roundId?: string;
  articleId?: string;
  muId?: string;
  itemCode?: string;
};
