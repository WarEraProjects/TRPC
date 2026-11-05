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
