import { integrationTest, assert, isObject, client } from "./helpers/context";

integrationTest("league.getUserLeague", async () => {
  const { items: [top] } = await client.ranking.getRankingPage({ rankingType: "weeklyUserDamages", limit: 1 });
  assert(top?.user, "expected a player in the weekly damage ranking");
  const value = await client.league.getUserLeague({ userId: top.user });

  assert(/^\d{4}-\d{1,2}$/.test(value.yearWeek) && typeof value.weekEndsAt === "string", "expected the week");
  assert(isObject(value.league) && typeof value.league.multiplier === "number", "expected the player's league");
  assert(value.me && Number.isInteger(value.me.rank), "expected the player's rank");
  assert(value.rows.some((row) => row.user === top.user), "expected the player among the rows");
  for (const row of value.rows) assert(typeof row.points === "number" && typeof row.isEligible === "boolean", "expected points and isEligible");
  for (const reward of value.placeRewards) assert(reward === null || typeof reward.money === "number", "expected a reward or null");

  const unknown = await client.league.getUserLeague({ userId: "000000000000000000000000" });
  assert(unknown.league === undefined && unknown.rows.length === 0, "expected no league for an unknown user");
});
