import { promises as fs } from "node:fs";
import path from "node:path";

import type { APIClient } from "../../src";
import { createAPIClient } from "../../src/trpc-client";
import type { JsonValue, OperationKey } from "./types";

let sharedTrpcClient: APIClient | undefined;

function getSharedTrpcClient(): APIClient {
  if (!sharedTrpcClient) {
    sharedTrpcClient = createAPIClient({
      url: process.env.WARERA_API_URL ?? "https://api2.warera.io/trpc",
      apiKey: process.env.WARERA_API_KEY,
    });
  }

  return sharedTrpcClient;
}

export class EndpointRunner {
  readonly responses: Record<string, JsonValue> = {};

  private readonly trpc = getSharedTrpcClient();

  get client(): APIClient {
    return this.trpc;
  }

  constructor(
    private readonly outputsRoot: string,
    private readonly outputBackupsRoot: string,
    readonly sampleSize: number
  ) {}

  async backupAndResetOutputs(): Promise<string | undefined> {
    try {
      await fs.access(this.outputsRoot);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        await fs.mkdir(this.outputsRoot, { recursive: true });
        return undefined;
      }
      throw error;
    }

    await fs.mkdir(this.outputBackupsRoot, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[.:]/g, "-");
    const backupPath = path.join(this.outputBackupsRoot, `outputs-${timestamp}`);

    await fs.cp(this.outputsRoot, backupPath, { recursive: true });
    await fs.rm(this.outputsRoot, { recursive: true, force: true });
    await fs.mkdir(this.outputsRoot, { recursive: true });

    return backupPath;
  }

  getResponse(operationKey: OperationKey): JsonValue | undefined {
    return this.responses[operationKey];
  }

  async loadOrFetch(
    operationKey: OperationKey,
    fetcher: () => Promise<unknown>,
    forceFetch?: boolean
  ): Promise<JsonValue> {
    const outputPath = this.getOutputPath(operationKey);
    if (!forceFetch) {
      const cached = await this.readJsonIfExists(outputPath);
      if (cached !== undefined) {
        this.responses[operationKey] = cached;
        return cached;
      }
    }

    const result = this.toJsonValue(await fetcher());
    this.responses[operationKey] = result;
    await this.writeJson(outputPath, result);
    return result;
  }

  async loadOrFetchByOperation(
    operationKey: OperationKey,
    input?: Record<string, unknown>,
    forceFetch?: boolean
  ): Promise<JsonValue> {
    return this.loadOrFetch(operationKey, () => this.callProcedure(operationKey, input), forceFetch);
  }

  resolveId(
    source: JsonValue | undefined,
    keys: string[],
    envKey: string
  ): string | undefined {
    return (
      this.findFirstString(source, { keys, matchSuffixId: true }) ??
      (process.env[envKey] ? String(process.env[envKey]) : undefined)
    );
  }

  requireId(label: string, id: string | undefined, envKey: string): string {
    if (!id) {
      throw new Error(`Missing ${label}. Provide cache data or set ${envKey}.`);
    }
    return id;
  }

  extractTopLevelItemIds(
    source: JsonValue | undefined,
    keys: string[],
    limit = this.sampleSize
  ): string[] {
    if (!source || typeof source !== "object") {
      return [];
    }

    const obj = source as { items?: unknown };
    if (!Array.isArray(obj.items)) {
      return [];
    }

    const result: string[] = [];
    for (const item of obj.items) {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        continue;
      }
      const record = item as Record<string, unknown>;
      for (const key of keys) {
        const value = record[key];
        if (typeof value === "string") {
          result.push(value);
          break;
        }
      }
      if (result.length >= limit) {
        break;
      }
    }

    return [...new Set(result)].slice(0, limit);
  }

  resolveCompanyIdFromCache(): string | undefined {
    const cached = this.responses["company.getCompanies"];
    return (
      this.resolveId(cached, ["companyId", "_id", "id"], "WARERA_COMPANY_ID") ??
      this.findFirstArrayItemId(cached, ["companyId", "_id", "id"]) ??
      this.findFirstArrayString(cached)
    );
  }

  finalItemCodeFromEnvOrCache(
    itemCode: string | undefined,
    envValue: string | undefined
  ): string | undefined {
    return itemCode ?? (envValue ? String(envValue) : undefined);
  }

  private getOutputPath(operationKey: OperationKey): string {
    const [group, name] = operationKey.split(".");
    return path.join(this.outputsRoot, group, `${name}.json`);
  }

  private async readJsonIfExists(filePath: string): Promise<JsonValue | undefined> {
    try {
      const content = await fs.readFile(filePath, "utf8");
      if (!content.trim()) {
        return undefined;
      }
      return JSON.parse(content) as JsonValue;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === "ENOENT") {
        return undefined;
      }
      throw error;
    }
  }

  private async writeJson(filePath: string, data: JsonValue): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
  }

  private async callProcedure(
    operationKey: OperationKey,
    input: Record<string, unknown> | undefined
  ): Promise<JsonValue> {
    const procedure = this.getProcedure(operationKey);
    if (!procedure) {
      throw new Error(`Unknown operation: ${operationKey}`);
    }

    const result = await procedure(input ?? {});
    return result as JsonValue;
  }

  private getProcedure(
    operationKey: OperationKey
  ): ((payload: Record<string, unknown>) => Promise<unknown>) | undefined {
    const [group, name] = operationKey.split(".");
    const groupCaller = (this.trpc as unknown as Record<string, unknown>)[group];

    if (
      !groupCaller ||
      (typeof groupCaller !== "object" && typeof groupCaller !== "function")
    ) {
      return undefined;
    }

    const candidate = (groupCaller as Record<string, unknown>)[name];
    if (typeof candidate !== "function") {
      return undefined;
    }

    return candidate as (payload: Record<string, unknown>) => Promise<unknown>;
  }

  private findFirstString(
    value: unknown,
    options: { keys?: string[]; matchSuffixId?: boolean } = {}
  ): string | undefined {
    const { keys = [], matchSuffixId = false } = options;
    const visited = new Set<unknown>();
    const stack: unknown[] = [value];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || typeof current !== "object") {
        continue;
      }

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      if (Array.isArray(current)) {
        for (const item of current) {
          stack.push(item);
        }
        continue;
      }

      for (const [key, val] of Object.entries(current)) {
        if (typeof val === "string") {
          if (keys.includes(key)) {
            return val;
          }
          if (matchSuffixId && key.toLowerCase().endsWith("id")) {
            return val;
          }
        }
        if (typeof val === "object" && val !== null) {
          stack.push(val);
        }
      }
    }

    return undefined;
  }

  private findFirstArrayItemId(
    source: JsonValue | undefined,
    keys: string[]
  ): string | undefined {
    if (!source || typeof source !== "object") {
      return undefined;
    }

    const stack: unknown[] = [source];
    const visited = new Set<unknown>();

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || typeof current !== "object") {
        continue;
      }
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      if (Array.isArray(current)) {
        for (const item of current) {
          if (item && typeof item === "object" && !Array.isArray(item)) {
            for (const key of keys) {
              const value = (item as Record<string, unknown>)[key];
              if (typeof value === "string") {
                return value;
              }
            }
          }
          stack.push(item);
        }
        continue;
      }

      for (const value of Object.values(current)) {
        if (value && typeof value === "object") {
          stack.push(value);
        }
      }
    }

    return undefined;
  }

  private findFirstArrayString(source: JsonValue | undefined): string | undefined {
    if (!source || typeof source !== "object") {
      return undefined;
    }

    const stack: unknown[] = [source];
    const visited = new Set<unknown>();

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current || typeof current !== "object") {
        continue;
      }
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      if (Array.isArray(current)) {
        for (const item of current) {
          if (typeof item === "string") {
            return item;
          }
          if (item && typeof item === "object") {
            stack.push(item);
          }
        }
        continue;
      }

      for (const value of Object.values(current)) {
        if (value && typeof value === "object") {
          stack.push(value);
        }
      }
    }

    return undefined;
  }

  private toJsonValue(value: unknown): JsonValue {
    if (value === null) {
      return null;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((entry) => this.toJsonValue(entry));
    }
    if (typeof value === "object") {
      const result: { [key: string]: JsonValue } = {};
      for (const [key, entry] of Object.entries(value)) {
        result[key] = this.toJsonValue(entry);
      }
      return result;
    }
    return String(value);
  }
}
