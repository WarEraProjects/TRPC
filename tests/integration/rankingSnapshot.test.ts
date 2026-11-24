import { integrationTest, assert, isObject, client } from "./helpers/context";

integrationTest("rankingSnapshot.getEntityRecentRanks", async () => {
  const { items: [top] } = await client.ranking.getRankingPage({ rankingType: "countryDamages", limit: 1 });
  assert(top?.country, "expected a country");
  const value = await client.rankingSnapshot.getEntityRecentRanks({ entityId: top.country });

  assert(value.days.length > 0 && value.days.every((day) => /^\d{4}-\d{2}-\d{2}$/.test(day)), "expected the days");
  assert(isObject(value.ranks) && Array.isArray(value.ranks.countryDamages), "expected the country rankings");
  for (const ranks of Object.values(value.ranks)) {
    assert(ranks.length === value.days.length, "expected one rank per day");
    assert(ranks.every((rank) => rank === null || Number.isInteger(rank)), "expected ranks or null");
  }
  assert(value.ranks.userDamages === undefined, "expected no player rankings for a country");
});

integrationTest("rankingSnapshot.getHistory and getPreviousRanks", async () => {
  const { items } = await client.ranking.getRankingPage({ rankingType: "countryDamages", limit: 5 });
  const ids = items.map((item) => item.country!).filter(Boolean);
  assert(ids.length > 0, "expected countries");

  const read = () => Promise.all([
    client.rankingSnapshot.getHistory({ entityId: ids[0], rankingType: "countryDamages", range: "7d" }),
    client.rankingSnapshot.getPreviousRanks({ rankingType: "countryDamages", entityIds: [...ids, "000000000000000000000000"] }),
  ]);
  let [history, previous] = await read();
  // A new daily snapshot can land between the two answers; one more read settles it.
  if (previous[ids[0]] !== history.at(-1)?.rank) [history, previous] = await read();

  assert(Array.isArray(history) && history.length > 0, "expected daily snapshots");
  for (const [index, day] of history.entries()) {
    assert(Number.isInteger(day.rank) && typeof day.value === "number" && Number.isInteger(day.count), "expected rank, value and count");
    if (index > 0) assert(history[index - 1].day < day.day, "expected the oldest day first");
  }
  assert(Object.values(previous).every(Number.isInteger), "expected ranks keyed by id");
  assert(!("000000000000000000000000" in previous), "expected an id without a rank to be left out");
  assert(previous[ids[0]] === history.at(-1)!.rank, "expected the rank of the latest snapshot");
});
