import { integrationTest, assert, client, countryId } from "./helpers/context";

integrationTest("election.getElections", async () => {
  const value = await client.election.getElections({ limit: 100, countryId, direction: "forward" });

			assert(Array.isArray(value.items), "expected items array");
});
