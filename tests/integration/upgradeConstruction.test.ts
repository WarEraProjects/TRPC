import { integrationTest, assert, client, countryId } from "./helpers/context";

integrationTest("upgradeConstruction.getMapConstructions", async () => {
  const value = await client.upgradeConstruction.getMapConstructions();

			assert(Array.isArray(value), "expected array response");
});

integrationTest("upgradeConstruction.listConstructions", async () => {
  const value = await client.upgradeConstruction.listConstructions({ countryId, limit: 5 });

			assert(Array.isArray(value.items), "expected items array");
			assert(value.nextCursor == null || typeof value.nextCursor === "string", "expected optional string nextCursor");
});

integrationTest("upgradeConstruction.getRegionConstructions", async () => {
  const regions = await client.region.getAll();
  const regionId = regions.find((region) => region.country === countryId)?._id ?? regions[0]?._id;
  assert(regionId, "expected at least one region");
  const value = await client.upgradeConstruction.getRegionConstructions({ regionId });

			assert(Array.isArray(value), "expected array response");
});
