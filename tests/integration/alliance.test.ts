import { integrationTest, assert, isObject, client, getAllianceId } from "./helpers/context";

integrationTest("alliance.getManyPaginated", async () => {
  const value = await client.alliance.getManyPaginated({ limit: 100 });

  assert(Array.isArray(value.items), "expected items array");
  assert(value.nextCursor === undefined || typeof value.nextCursor === "string", "expected optional string nextCursor");
});

integrationTest("alliance.getById", async () => {
  const value = await client.alliance.getById({ allianceId: await getAllianceId() });

  assert(isObject(value), "expected object response");
  assert(typeof value._id === "string", "expected string _id");
  assert(typeof value.name === "string", "expected string name");
  assert(typeof value.leader === "string", "expected string leader");
  assert(Array.isArray(value.memberCountries), "expected memberCountries array");
  assert(isObject(value.rankings), "expected rankings object");
});

integrationTest("alliance.getByIds", async () => {
  const value = await client.alliance.getByIds({ ids: [await getAllianceId()] });

  assert(Array.isArray(value), "expected array response");
  assert(value.length > 0, "expected at least one alliance");
  assert(typeof value[0]._id === "string", "expected string _id on first alliance");
});

integrationTest("alliance.getStrategicResourceBonuses", async () => {
  const allianceId = await getAllianceId();
  const value = await client.alliance.getStrategicResourceBonuses({ allianceId });

  assert(value === null || isObject(value), "expected null or a bonuses object");
  if (value) {
    assert(value.allianceId === allianceId, "expected the alliance id back");
    assert(Array.isArray(value.countryIds) && value.countryIds.length > 0, "expected country ids");
    assert(isObject(value.regionIds) && isObject(value.bonuses.skills), "expected regionIds and bonus skills");
    assert(typeof value.bonuses.productionPercent === "number", "expected numeric productionPercent");
  }
});
