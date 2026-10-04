import { integrationTest, assert, isObject, client } from "./helpers/context";

integrationTest("war.getById", async () => {
  const battles = await client.battle.getBattles({ limit: 1 });
  const warId = battles.items?.[0]?.war;
  assert(typeof warId === "string", "expected a battle with a war id");
  const value = await client.war.getById({ warId });

			assert(isObject(value), "expected object response");
			assert(value._id === warId, "expected the requested war");
			assert(typeof value.attacker.country === "string", "expected string attacker.country");
			assert(typeof value.defender.damages === "number", "expected numeric defender.damages");
			assert(typeof value.isActive === "boolean", "expected boolean isActive");
			assert(Array.isArray(value.battles), "expected battles array");
});
