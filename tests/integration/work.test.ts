import { integrationTest, assert, client, testIds } from "./helpers/context";

function assertStatsRows(value: unknown[]) {
			assert(Array.isArray(value), "expected array response");
			for (const row of value as { dailyDate?: unknown; total?: unknown }[]) {
				assert(typeof row.dailyDate === "string", "expected string dailyDate on every row");
				assert(typeof row.total === "number", "expected numeric total on every row");
			}
}

integrationTest("work.getStatsByUserId", async () => {
  const value = await client.work.getStatsByUserId({ userId: testIds.userId, days: 7, timezone: "Europe/Amsterdam" });

			assertStatsRows(value);
}, ["userId"]);

integrationTest("work.getStatsByCompany", async () => {
  const value = await client.work.getStatsByCompany({ companyId: testIds.companyId, days: 7, timezone: "Europe/Amsterdam" });

			assertStatsRows(value);
}, ["companyId"]);

integrationTest("work.getStatsByCompany without days and timezone", async () => {
  const value = await client.work.getStatsByCompany({ companyId: testIds.companyId });

			assertStatsRows(value);
}, ["companyId"]);

integrationTest("work.getStatsByWorker", async () => {
  const value = await client.work.getStatsByWorker({ workerId: testIds.workerId, days: 14 });

			assertStatsRows(value);
}, ["workerId"]);

integrationTest("work.getStatsByWorkerAndCompany", async () => {
  const value = await client.work.getStatsByWorkerAndCompany({
			workerId: testIds.workerId,
			companyId: testIds.companyId,
			days: 14,
			timezone: "Europe/Amsterdam",
		});

			assertStatsRows(value);
}, ["workerId", "companyId"]);
