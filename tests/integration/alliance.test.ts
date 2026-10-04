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
