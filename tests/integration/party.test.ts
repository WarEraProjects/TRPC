import { integrationTest, assert, isObject, client, countryId, getPartyId } from "./helpers/context";

integrationTest("party.getManyPaginated", async () => {
  const value = await client.party.getManyPaginated({ limit: 100, countryId, direction: "forward" });

  assert(Array.isArray(value.items), "expected items array");
});

integrationTest("party.getById", async () => {
  const value = await client.party.getById({ partyId: await getPartyId() });

  assert(isObject(value), "expected object response");
  assert(typeof value._id === "string", "expected string _id");
});

integrationTest("party.getInactiveMemberIds", async () => {
  const partyId = await getPartyId();
  const [party, value] = await Promise.all([
    client.party.getById({ partyId }),
    client.party.getInactiveMemberIds({ partyId }),
  ]);

  assert(Array.isArray(value), "expected an array");
  assert(value.every((id) => party.members.includes(id)), "expected ids from the party's members");
});
