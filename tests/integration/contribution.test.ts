import { integrationTest, assert, isObject, client, countryId } from "./helpers/context";

integrationTest("contribution.getCountryUnrestContributions", async () => {
  const value = await client.contribution.getCountryUnrestContributions({ countryId, page: 1 });

			assert(Array.isArray(value.results), "expected results array");
			assert(value.page === 1, "expected page 1 to be echoed");
			assert(typeof value.pages === "number", "expected numeric pages");
			assert(typeof value.count === "number", "expected numeric count");
			if (value.results.length > 0) {
				assert(isObject(value.results[0].user), "expected populated user on first contribution");
				assert(typeof value.results[0].amount === "number", "expected numeric amount");
			}
});

integrationTest("contribution.getRegionContributions", async () => {
  const regions = await client.region.getAll();
  const regionId = regions.find((region) => region.lastResistanceContributionAt)?._id ?? regions[0]?._id;
  assert(regionId, "expected at least one region");
  const value = await client.contribution.getRegionContributions({ regionId });

			assert(Array.isArray(value.results), "expected results array");
			assert(typeof value.page === "number", "expected numeric page");
			assert(typeof value.pages === "number", "expected numeric pages");
});
