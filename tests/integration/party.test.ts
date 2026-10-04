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
