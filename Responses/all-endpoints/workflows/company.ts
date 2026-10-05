import type { EndpointRunner } from "../runner";
import type { CollectedIds } from "../types";

export async function runCompanyWorkflow(
  runner: EndpointRunner,
  ids: CollectedIds
): Promise<void> {
  const trpc = runner.client;

  const companies =
    runner.getResponse("company.getCompanies") ??
    (await runner.loadOrFetch("company.getCompanies", () => trpc.company.getCompanies({})));

  const companyId =
    runner.resolveId(companies, ["companyId", "_id", "id"], "WARERA_COMPANY_ID") ??
    runner.extractTopLevelItemIds(companies, ["companyId", "_id", "id"], 1)[0];

  ids.companyId = companyId;

  if (companyId) {
    await runner.loadOrFetch("company.getById", () => trpc.company.getById({ companyId }));
    await runner.loadOrFetch("worker.getWorkers", () => trpc.worker.getWorkers({ companyId }));
    return;
  }

  const userId = ids.userId;
  if (userId) {
    await runner.loadOrFetch("worker.getWorkers", () => trpc.worker.getWorkers({ userId }));
  }
}
