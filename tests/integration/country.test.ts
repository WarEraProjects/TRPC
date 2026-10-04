import { integrationTest, assert, isObject, client, countryId } from "./helpers/context";

integrationTest("country.getUnrestData", async () => {
  const value = await client.country.getUnrestData({ countryId });

			assert(isObject(value), "expected object response");
			assert(typeof value.bar === "number", "expected numeric bar");
			assert(typeof value.barMax === "number", "expected numeric barMax");
			assert(typeof value.isFull === "boolean", "expected boolean isFull");
			assert(typeof value.isOnRevolutionCooldown === "boolean", "expected boolean isOnRevolutionCooldown");
});
