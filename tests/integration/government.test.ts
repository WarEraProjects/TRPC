import { integrationTest, assert, client, countryId } from "./helpers/context";

integrationTest("government.getByCountryId", async () => {
  const value = await client.government.getByCountryId({ countryId });

  assert(value.country === countryId, "expected the requested country");
  assert(Array.isArray(value.congressMembers), "expected congress members");
  assert(value.president === undefined || typeof value.president === "string", "expected an optional president");
  // Since 2026-11-24 the ministers are a list; a government not yet moved keeps the three fields.
  assert(Array.isArray(value.ministers) || typeof value.minOfDefense === "string"
    || typeof value.minOfEconomy === "string" || typeof value.minOfForeignAffairs === "string" || value.president === undefined,
    "expected a ministers list or the legacy minister fields");
  for (const minister of value.ministers ?? []) {
    assert(typeof minister.user === "string" && typeof minister.title === "string", "expected user and title on every minister");
    assert(Array.isArray(minister.rights) && minister.rights.every((right) => typeof right === "string"), "expected rights on every minister");
    assert(typeof minister.appointedAt === "string", "expected appointedAt on every minister");
    assert(minister.customTitle === undefined || typeof minister.customTitle === "string", "expected an optional custom title");
  }
});

integrationTest("government.getCongressSeats", async () => {
  const value = await client.government.getCongressSeats({ countryId });

  assert(Array.isArray(value), "expected an array");
  for (const seat of value) {
    assert(typeof seat.user === "string", "expected a user id");
    assert(seat.party === undefined || typeof seat.party === "string", "expected an optional party id");
    assert(typeof seat.hasLeftParty === "boolean", "expected boolean hasLeftParty");
  }
});
