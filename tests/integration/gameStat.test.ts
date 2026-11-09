import { integrationTest, assert, isObject, client } from "./helpers/context";

integrationTest("gameStat.getEquipmentAvgByCode", async () => {
  const value = await client.gameStat.getEquipmentAvgByCode({ itemCode: "gun" });

  assert(typeof value === "number", "expected numeric average");
});

integrationTest("gameStat.getWorldDevelopment", async () => {
  const value = await client.gameStat.getWorldDevelopment();

  assert(typeof value === "number", "expected numeric world development");
  assert(value > 0, "expected positive world development");
});

integrationTest("gameStat.getPpMoneyValue", async () => {
  const value = await client.gameStat.getPpMoneyValue();

  assert(typeof value === "number", "expected numeric production point value");
  assert(value > 0, "expected positive production point value");
});

integrationTest("gameStat.getPpMoneyValueByItem", async () => {
  const value = await client.gameStat.getPpMoneyValueByItem();

  assert(isObject(value), "expected values keyed by item code");
  assert(typeof value.steel === "number" && value.steel > 0, "expected a positive value for steel");
});

integrationTest("gameStat.getBadgeStats", async () => {
  const value = await client.gameStat.getBadgeStats();

  assert(isObject(value.alphaTester), "expected a row for alphaTester");
  for (const row of Object.values(value)) {
    assert(typeof row.count === "number" && typeof row.percent === "number", "expected count and percent");
  }
});

integrationTest("gameStat.getMilestoneStats", async () => {
  const value = await client.gameStat.getMilestoneStats();

  assert(isObject(value.reachXp) && isObject(value.reachXp["1"]), "expected tier 1 of reachXp");
  assert(typeof value.reachXp["1"].count === "number", "expected a numeric count");
});
