import { integrationTest, assert, isObject, client, getTournamentId, getTournamentTeamId } from "./helpers/context";

integrationTest("tournament.getLastTournament", async () => {
  const value = await client.tournament.getLastTournament();

			assert(isObject(value), "expected object response");
			assert(typeof value._id === "string", "expected string _id");
			assert(typeof value.name === "string", "expected string name");
			assert(typeof value.status === "string", "expected string status");
			assert(isObject(value.registered), "expected registered object");
			assert(isObject(value.rounds), "expected rounds object");
});

integrationTest("tournamentTeam.getByTournamentId", async () => {
  const value = await client.tournamentTeam.getByTournamentId({ tournamentId: await getTournamentId() });

			assert(Array.isArray(value), "expected array response");
			if (value.length > 0) {
				assert(typeof value[0]._id === "string", "expected string _id on first team");
				assert(typeof value[0].tournament === "string", "expected string tournament on first team");
			}
});

integrationTest("tournamentTeam.getById", async () => {
  const value = await client.tournamentTeam.getById({ tournamentTeamId: await getTournamentTeamId() });

			assert(isObject(value), "expected object response");
			assert(typeof value._id === "string", "expected string _id");
			assert(typeof value.tournament === "string", "expected string tournament");
			assert(Array.isArray(value.participants), "expected participants array");
});
