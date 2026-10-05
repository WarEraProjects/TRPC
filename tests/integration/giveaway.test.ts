import { integrationTest, assert, isObject, client } from "./helpers/context";

integrationTest("giveaway.getManyPaginated", async () => {
  const value = await client.giveaway.getManyPaginated({ limit: 5 });

			assert(Array.isArray(value.items), "expected items array");
			assert(value.nextCursor == null || typeof value.nextCursor === "string", "expected optional string nextCursor");
			if (value.items.length > 0) {
				assert(typeof value.items[0]._id === "string", "expected string _id on first giveaway");
				assert(isObject(value.items[0].prize), "expected prize object on first giveaway");
				assert(Array.isArray(value.items[0].winners), "expected winners array on first giveaway");
			}
});
