import { integrationTest, assert, client, testIds } from "./helpers/context";

for (const selector of ["companyId", "userId"] as const) {
  integrationTest(`worker.getWorkers with ${selector} only`, async () => {
    const input = selector === "companyId"
      ? { companyId: testIds.companyId }
      : { userId: testIds.userId };
    const value = await client.worker.getWorkers(input);
    if (selector === "companyId") {
      assert(value.type === "company", "expected company-scoped workers response");
      assert(Array.isArray(value.workers), "expected workers array");
    } else {
      assert(value.type === "user", "expected user-scoped workers response");
      assert(Array.isArray(value.workersPerCompany), "expected workers grouped by company");
    }
  }, [selector]);
}

integrationTest("worker.getWorkers with both selectors", async () => {
  const value = await client.worker.getWorkers({
    companyId: testIds.companyId,
    userId: testIds.userId,
  });
  assert(value.type === "company", "expected company selector to take precedence");
  assert(Array.isArray(value.workers), "expected workers array");
}, ["companyId", "userId"]);

integrationTest("worker.getWorkers rejects missing selectors", async () => {
  try {
    // @ts-expect-error deliberately exercise server validation behind the type contract
    await client.worker.getWorkers({});
  } catch (error) {
    assert(error instanceof Error && /Either companyId or userId is required/.test(error.message),
      "expected the server's missing-selector error");
    return;
  }
  throw new Error("expected missing selectors to be rejected");
});
