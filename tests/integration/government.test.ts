import { integrationTest, assert, client, countryId } from "./helpers/context";

integrationTest("government.getCongressSeats", async () => {
  const value = await client.government.getCongressSeats({ countryId });

  assert(Array.isArray(value), "expected an array");
  for (const seat of value) {
    assert(typeof seat.user === "string", "expected a user id");
    assert(seat.party === undefined || typeof seat.party === "string", "expected an optional party id");
    assert(typeof seat.hasLeftParty === "boolean", "expected boolean hasLeftParty");
  }
});
