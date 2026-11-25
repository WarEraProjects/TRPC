import { integrationTest, assert, client, testIds } from "./helpers/context";

integrationTest("muMember.getByMu", async () => {
  const muId = testIds.muId;
  const members = await client.muMember.getByMu({ muId });

  assert(Array.isArray(members) && members.length > 0, "expected a non-empty array of MU members");
  for (const member of members) {
    assert(member.mu === muId, "expected member to belong to the requested MU");
    assert(typeof member._id === "string" && typeof member.user === "string", "expected string _id and user");
    for (const field of ["totalDamagesCount", "monthlyDamagesCount", "weeklyDamagesCount", "totalHelpCount", "monthlyHelpCount", "weeklyHelpCount"] as const) {
      assert(typeof member[field] === "number", `expected numeric ${field}`);
    }
  }
}, ["muId"]);
