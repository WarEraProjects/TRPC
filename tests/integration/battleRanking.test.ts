import { integrationTest, assert, client } from "./helpers/context";

integrationTest("battleRanking.getPrivateMercenaryDamage", async () => {
  const { items: [battle] } = await client.battle.getBattles({ isActive: true, limit: 1 });
  assert(battle, "expected an active battle");

  for (const value of [
    await client.battleRanking.getPrivateMercenaryDamage({ battleId: battle._id }),
    await client.battleRanking.getPrivateMercenaryDamage({ battleId: battle._id, roundId: battle.rounds.at(-1) }),
  ]) {
    assert(typeof value.attacker === "number" && value.attacker >= 0, "expected attacker damage");
    assert(typeof value.defender === "number" && value.defender >= 0, "expected defender damage");
  }

  const unknown = await client.battleRanking.getPrivateMercenaryDamage({ battleId: "000000000000000000000000" });
  assert(unknown.attacker === 0 && unknown.defender === 0, "expected 0 on both sides for an unknown battle");
});
