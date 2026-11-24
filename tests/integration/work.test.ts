import { integrationTest, assert, client, testIds, getEmployeeSample } from "./helpers/context";

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
}, ["userId"], { premium: true });

integrationTest("work.getStatsByCompany", async () => {
  const value = await client.work.getStatsByCompany({ companyId: testIds.companyId, days: 7, timezone: "Europe/Amsterdam" });

  assertStatsRows(value);
}, ["companyId"], { premium: true });

integrationTest("work.getStatsByCompany without days and timezone", async () => {
  const value = await client.work.getStatsByCompany({ companyId: testIds.companyId });

  assertStatsRows(value);
}, ["companyId"], { premium: true });

integrationTest("work.getLastByEmployee", async () => {
  const { employeeId } = await getEmployeeSample();
  const value = await client.work.getLastByEmployee({ employeeId, limit: 5 });

  assert(Array.isArray(value) && value.length <= 5, "expected at most 5 shifts");
  for (const [index, shift] of value.entries()) {
    assert(typeof shift._id === "string" && typeof shift.createdAt === "string", "expected _id and createdAt");
    assert(typeof shift.wage === "number" && typeof shift.production === "number", "expected numeric wage and production");
    assert(shift.tool === undefined || (typeof shift.tool.code === "string" && typeof shift.tool.state === "number"), "expected an optional tool");
    if (index > 0) assert(value[index - 1].createdAt >= shift.createdAt, "expected the newest shift first");
  }

  const unknown = await client.work.getLastByEmployee({ employeeId: "000000000000000000000000" });
  assert(Array.isArray(unknown) && unknown.length === 0, "expected no shifts for an unknown employee");
  const tooMany = await client.work.getLastByEmployee({ employeeId, limit: 51 }).then(() => null, (error: Error) => error.message);
  assert(tooMany?.includes("less than or equal to 50"), "expected a limit above 50 to be rejected");
}, [], { premium: true });

integrationTest("work.getStatsByEmployee", async () => {
  const { employeeId } = await getEmployeeSample();
  const value = await client.work.getStatsByEmployee({ employeeId, days: 60 });

  assert(Array.isArray(value) && value.length <= 60, "expected at most 60 days");
  for (const [index, day] of value.entries()) {
    assert(/^\d{4}-\d{2}-\d{2}$/.test(day.dailyDate), "expected dailyDate as YYYY-MM-DD");
    assert(typeof day.total === "number" && typeof day.wage === "number" && typeof day.employeeProd === "number", "expected total, wage and employeeProd");
    if (index > 0) assert(value[index - 1].dailyDate < day.dailyDate, "expected the oldest day first");
  }

  const unknown = await client.work.getStatsByEmployee({ employeeId: "000000000000000000000000" });
  assert(Array.isArray(unknown) && unknown.length === 0, "expected no days for an unknown employee");
  const tooLong = await client.work.getStatsByEmployee({ employeeId, days: 61 }).then(() => null, (error: Error) => error.message);
  assert(tooLong?.includes("less than or equal to 60"), "expected more than 60 days to be rejected");
}, [], { premium: true });
