import { integrationTest, assert, isObject, client, testIds } from "./helpers/context";

integrationTest("company.getProductionBonus", async () => {
  const value = await client.company.getProductionBonus({ companyId: testIds.companyId });

			assert(isObject(value), "expected object response");

			for (const key of ["strategicBonus", "depositBonus", "ethicSpecializationBonus", "ethicDepositBonus", "total"] as const) {
				assert(typeof value[key] === "number", `expected numeric ${key}`);
			}
});

integrationTest("company.getRecommendedRegionIdsByItemCode", async () => {
  const value = await client.company.getRecommendedRegionIdsByItemCode({ itemCode: "steel", includeDeposit: true });

			assert(Array.isArray(value), "expected array response");
});
