import { integrationTest, assert, client } from "./helpers/context";

let cachedBattle: Promise<{ battleId: string; countryId: string }> | undefined;
function getActiveBattle() {
  return cachedBattle ??= (async () => {
    const { items: [battle] } = await client.battle.getBattles({ isActive: true, limit: 1 });
    assert(battle, "expected an active battle");
    return { battleId: battle._id, countryId: battle.attacker.country };
  })();
}

integrationTest("battle.getActiveBattlesByCountry", async () => {
  const { battleId, countryId } = await getActiveBattle();
  const value = await client.battle.getActiveBattlesByCountry({ countryId });

  assert(Array.isArray(value) && value.every((id) => typeof id === "string"), "expected battle ids");
  // The battle can end between the two reads.
  assert(value.includes(battleId) || !(await client.battle.getById({ battleId })).isActive, "expected the attacker's active battle");
});

integrationTest("battle.getViewersCount", async () => {
  const value = await client.battle.getViewersCount({ battleId: (await getActiveBattle()).battleId });

  assert(Number.isInteger(value) && value >= 0, "expected a viewer count");
});
