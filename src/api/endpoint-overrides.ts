import type { WorkersPerCompanyItem } from "./Responses";

/** The server requires at least one selector; both may be supplied. */
export type WorkerGetWorkersInput =
  | { companyId: string; userId?: string }
  | { userId: string; companyId?: string };

/** Runtime constraints absent from the generated OpenAPI schema. */
export type ApiInputOverrides = {
  "worker.getWorkers": WorkerGetWorkersInput;
};

/** Company selection takes precedence when both selectors are supplied. */
export type WorkerGetWorkersCompanyResponse = {
  type: "company";
  workers: unknown[];
};

export type WorkerGetWorkersUserResponse = {
  type: "user";
  workersPerCompany: WorkersPerCompanyItem[];
};

export type ApiResponseOverrides = {
  "worker.getWorkers": WorkerGetWorkersCompanyResponse | WorkerGetWorkersUserResponse;
};
