import { integrationTest, assert, client, testIds } from "./helpers/context";

integrationTest("muMember.getByMu", async () => {
  const value = await client.muMember.getByMu({ muId: testIds.muId });

			assert(Array.isArray(value), "expected array response");
}, ["muId"]);
