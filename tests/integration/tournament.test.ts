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

integrationTest("tournament.getById", async () => {
  const tournamentId = await getTournamentId();
  const value = await client.tournament.getById({ tournamentId });

			assert(isObject(value), "expected object response");
			assert(value._id === tournamentId, "expected the requested tournament");
			assert(isObject(value.rounds), "expected rounds object");
			for (const round of Object.values(value.rounds)) {
				assert(Array.isArray(round.matches), "expected matches array on every round");
				for (const match of round.matches) {
					assert(typeof match.battle === "string", "expected string battle on every match");
					assert(match.wonBy === undefined || match.wonBy === "attacker" || match.wonBy === "defender", "expected wonBy side");
				}
			}
});

integrationTest("tournament.getManyPaginated", async () => {
  const value = await client.tournament.getManyPaginated({ limit: 5 });

			assert(Array.isArray(value.items), "expected items array");
			assert(value.nextCursor == null || typeof value.nextCursor === "string", "expected optional string nextCursor");
			if (value.items.length > 0) {
				assert(typeof value.items[0]._id === "string", "expected string _id on first tournament");
				assert(typeof value.items[0].status === "string", "expected string status on first tournament");
			}
});

integrationTest("tournamentTeam.getByTournamentId", async () => {
  const value = await client.tournamentTeam.getByTournamentId({ tournamentId: await getTournamentId() });

			assert(Array.isArray(value), "expected array response");
			if (value.length > 0) {
				assert(typeof value[0]._id === "string", "expected string _id on first team");
				assert(typeof value[0].tournament === "string", "expected string tournament on first team");
				assert(typeof value[0].totalDamage === "number", "expected numeric totalDamage on first team");
				assert(isObject(value[0].damageByEntity), "expected damageByEntity object on first team");
			}
});

integrationTest("tournamentTeam.getById", async () => {
  const value = await client.tournamentTeam.getById({ tournamentTeamId: await getTournamentTeamId() });

			assert(isObject(value), "expected object response");
			assert(typeof value._id === "string", "expected string _id");
			assert(typeof value.tournament === "string", "expected string tournament");
			assert(Array.isArray(value.participants), "expected participants array");
});
