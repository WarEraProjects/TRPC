import { integrationTest, assert, client } from "./helpers/context";

integrationTest("gameStat.getEquipmentAvgByCode", async () => {
  const value = await client.gameStat.getEquipmentAvgByCode({ itemCode: "gun" });

			assert(typeof value === "number", "expected numeric average");
});

integrationTest("gameStat.getWorldDevelopment", async () => {
  const value = await client.gameStat.getWorldDevelopment();

			assert(typeof value === "number", "expected numeric world development");
			assert(value > 0, "expected positive world development");
});
