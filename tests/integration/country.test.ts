import { integrationTest, assert, isObject, client, countryId } from "./helpers/context";

integrationTest("country.getUnrestData", async () => {
  const value = await client.country.getUnrestData({ countryId });

  assert(isObject(value), "expected object response");
  assert(typeof value.bar === "number", "expected numeric bar");
  assert(typeof value.barMax === "number", "expected numeric barMax");
  assert(typeof value.isFull === "boolean", "expected boolean isFull");
  assert(typeof value.isOnRevolutionCooldown === "boolean", "expected boolean isOnRevolutionCooldown");
});

integrationTest("country.getStrategicResourceBonuses", async () => {
  const value = await client.country.getStrategicResourceBonuses({ countryId });

  assert(value === null || isObject(value), "expected null or a bonuses object");
  if (value) {
    assert(value.allianceId === undefined || typeof value.allianceId === "string", "expected an optional alliance id");
    assert(Array.isArray(value.countryIds) && value.countryIds.length > 0, "expected country ids");
    assert(isObject(value.regionIds) && isObject(value.bonuses.skills), "expected regionIds and bonus skills");
  }
});
