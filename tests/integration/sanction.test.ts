import { integrationTest, assert, isObject, client } from "./helpers/context";

integrationTest("sanction.getPaginated", async () => {
  const value = await client.sanction.getPaginated({ limit: 5 });

			assert(Array.isArray(value.items), "expected items array");
			assert(value.nextCursor == null || typeof value.nextCursor === "string", "expected optional string nextCursor");
			for (const sanction of value.items) {
				assert(typeof sanction.targetUser === "string", "expected string targetUser");
				assert(isObject(sanction.data), "expected data object");
				assert(typeof sanction.data.type === "string", "expected string data.type");
			}
});

integrationTest("sanction.getPaginated filtered by type", async () => {
  const value = await client.sanction.getPaginated({ type: "BAN", limit: 3 });

			assert(Array.isArray(value.items), "expected items array");
			assert(value.items.every((sanction) => sanction.data.type === "BAN"), "expected only BAN sanctions");
			for (const sanction of value.items) {
				if (sanction.data.type === "BAN") {
					assert(typeof sanction.data.banDurationInDays === "number", "expected numeric banDurationInDays");
					assert(typeof sanction.data.reason === "string", "expected string reason");
				}
			}
});
