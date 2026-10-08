import { integrationTest, assert, isObject, client, countryId } from "./helpers/context";

integrationTest("election.getElections", async () => {
  const value = await client.election.getElections({ limit: 100, countryId, direction: "forward" });

			assert(Array.isArray(value.items), "expected items array");
});

integrationTest("election.getElection", async () => {
  const elections = await client.election.getElections({ limit: 1, countryId });
  const electionId = elections.items?.[0]?._id;
  assert(electionId, "expected at least one election to test election.getElection");
  const value = await client.election.getElection({ electionId });

			assert(isObject(value), "expected object response");
			assert(value._id === electionId, "expected the requested election");
			assert(Array.isArray(value.candidates), "expected candidates array");
			assert(isObject(value.votes), "expected votes object");
});
