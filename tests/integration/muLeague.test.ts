import { integrationTest, assert, isObject, client } from "./helpers/context";

integrationTest("muLeague.getDivisionCounts", async () => {
  const value = await client.muLeague.getDivisionCounts();

  assert(typeof value.yearWeek === "string", "expected the week");
  assert(value.mus.length > 0 && value.mus.every(Number.isInteger), "expected a count per division");
});

integrationTest("muLeague.getMuLeague", async () => {
  const { items: [top] } = await client.ranking.getRankingPage({ rankingType: "muWeeklyDamages", limit: 1 });
  assert(top?.mu, "expected an MU in the weekly damage ranking");
  const value = await client.muLeague.getMuLeague({ muId: top.mu });

  assert(isObject(value.league) && Number.isInteger(value.league.groupsCount), "expected the MU's league");
  assert(value.me && ["up", "stay", "down"].includes(value.me.move), "expected the MU's move");
  assert(value.rows.some((row) => row.mu === top.mu), "expected the MU among the rows");
  for (const row of value.rows) {
    assert(["up", "stay", "down"].includes(row.move), `unexpected move ${row.move}`);
    assert(row.pot === null || typeof row.pot.money === "number", "expected a pot or null");
  }
  for (const share of value.shares) {
    assert(typeof share.share === "number" && share.share >= 0 && share.share <= 1, "expected a share between 0 and 1");
  }

  const unknown = await client.muLeague.getMuLeague({ muId: "000000000000000000000000" });
  assert(unknown.league === undefined && unknown.rows.length === 0, "expected no league for an unknown MU");
});
