import { integrationTest, assert, client } from "./helpers/context";

integrationTest("search.searchUsers", async () => {
  const value = await client.search.searchUsers({ searchText: "a" });

			assert(Array.isArray(value), "expected array response");
			assert(value.every((id) => typeof id === "string"), "expected user ids");
});

integrationTest("search.searchMus", async () => {
  const value = await client.search.searchMus({ searchText: "a" });

			assert(Array.isArray(value), "expected array response");
			assert(value.every((id) => typeof id === "string"), "expected MU ids");
});
