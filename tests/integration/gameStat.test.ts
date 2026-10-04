import { integrationTest, assert, client } from "./helpers/context";

integrationTest("gameStat.getEquipmentAvgByCode", async () => {
  const value = await client.gameStat.getEquipmentAvgByCode({ itemCode: "gun" });

			assert(typeof value === "number", "expected numeric average");
});
