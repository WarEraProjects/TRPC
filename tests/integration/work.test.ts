import { integrationTest, assert, client, testIds } from "./helpers/context";

integrationTest("work.getStatsByUserId", async () => {
  const value = await client.work.getStatsByUserId({ userId: testIds.userId, days: 7, timezone: "Europe/Amsterdam" });

			assert(Array.isArray(value), "expected array response");
});

integrationTest("work.getStatsByCompany", async () => {
  const value = await client.work.getStatsByCompany({ companyId: testIds.companyId, days: 7, timezone: "Europe/Amsterdam" });

			assert(Array.isArray(value), "expected array response");
});

integrationTest("work.getStatsByWorkerAndCompany", async () => {
  const value = await client.work.getStatsByWorkerAndCompany({
			workerId: testIds.workerId,
			companyId: testIds.companyId,
			days: 14,
			timezone: "Europe/Amsterdam",
		});

			assert(Array.isArray(value), "expected array response");
});
