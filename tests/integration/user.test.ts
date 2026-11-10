import { integrationTest, assert, client, testIds } from "./helpers/context";

integrationTest("user.getUserSkills", async () => {
  const value = await client.user.getUserSkills({ userId: testIds.userId });

  assert(value._id === testIds.userId, "expected the requested user");
  assert(typeof value.skills.energy.currentBarValue === "number", "expected the energy bar");
  assert(typeof value.skills.attack.militaryRankPercent === "number", "expected the attack breakdown");
  assert(typeof value.leveling.level === "number", "expected leveling");
}, ["userId"]);

integrationTest("user.getTodayClaimCount", async () => {
  const value = await client.user.getTodayClaimCount();

  assert(Number.isInteger(value) && value >= 0, "expected a count");
});
