import { integrationTest, assert, isObject, client, countryId } from "./helpers/context";

integrationTest("workOffer.getWageStats", async () => {
  const value = await client.workOffer.getWageStats({ energy: 90, production: 31, citizenship: countryId });

			assert(isObject(value.allowedRange), "expected allowedRange object");
			assert(typeof value.topOffer === "number", "expected numeric topOffer");
			assert(typeof value.topEligibleOffer === "number", "expected numeric topEligibleOffer");
			assert(Array.isArray(value.topEligibleOffers), "expected topEligibleOffers array");
});
