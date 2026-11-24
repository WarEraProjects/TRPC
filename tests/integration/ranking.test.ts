import { integrationTest, assert, isObject, client } from "./helpers/context";

function checkEntry(entry: unknown, rankingType: string, idKey: "user" | "country" | "mu" | "alliance") {
  assert(isObject(entry), "expected an entry object");
  assert(entry.type === rankingType, `expected type ${rankingType}, got ${entry.type}`);
  assert(typeof entry[idKey] === "string", `expected string ${idKey}`);
  assert(typeof entry.value === "number", "expected numeric value");
  assert(Number.isInteger(entry.rank) && typeof entry.tier === "string", "expected rank and tier");
}

function checkDetails(details: unknown, rankingType: string) {
  assert(isObject(details), "expected ranking details");
  assert(details.type === rankingType, `expected type ${rankingType}, got ${details.type}`);
  assert(Number.isInteger(details.count), "expected integer count");
  assert(typeof details.updatedAt === "string" && isObject(details.tierValues), "expected updatedAt and tierValues");
  assert(details.zeroRank === undefined || Number.isInteger(details.zeroRank), "expected zeroRank to be absent or a rank");
}

integrationTest("ranking.getRanking", async () => {
  const value = await client.ranking.getRanking({ rankingType: "countryDamages" });

  checkDetails(value, "countryDamages");
  assert(value.items.length > 0 && value.items.length <= 100, "expected up to 100 entries");
  for (const entry of value.items) checkEntry(entry, "countryDamages", "country");
});

integrationTest("ranking.getRankingPage", async () => {
  const first = await client.ranking.getRankingPage({ rankingType: "userDamages", limit: 3 });

  checkDetails(first.ranking, "userDamages");
  assert(first.items.length === 3, "expected 3 entries");
  for (const entry of first.items) checkEntry(entry, "userDamages", "user");
  assert(first.nextCursor, "expected a next cursor");

  const second = await client.ranking.getRankingPage({ rankingType: "userDamages", limit: 3, cursor: first.nextCursor });
  assert(second.ranking === undefined, "expected the details with the first page only");
  assert(second.items.length > 0 && second.items[0].rank >= first.items[2].rank, "expected the second page to continue the ranking");
});

integrationTest("ranking.getRankingAround", async () => {
  const { items } = await client.ranking.getRankingPage({ rankingType: "muDamages", limit: 5 });
  const muId = items[2]?.mu;
  assert(muId, "expected an MU at rank 3");

  const value = await client.ranking.getRankingAround({ rankingType: "muDamages", entityId: muId });
  assert(Array.isArray(value) && value.length === 3, "expected the entry with one neighbour on each side");
  for (const entry of value) checkEntry(entry, "muDamages", "mu");
  assert(value.some((entry) => entry.mu === muId), "expected the requested MU among the entries");

  const none = await client.ranking.getRankingAround({ rankingType: "muDamages", entityId: "000000000000000000000000" });
  assert(Array.isArray(none) && none.length === 0, "expected no entries for an unknown id");
});
