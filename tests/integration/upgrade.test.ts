import { integrationTest, assert, isObject, client, testIds } from "./helpers/context";

integrationTest("upgrade.getUpgradeByTypeAndEntity headquarters", async () => {
  const value = await client.upgrade.getUpgradeByTypeAndEntity({ upgradeType: "headquarters", muId: testIds.muId });

			assert(isObject(value), "expected object response");
			assert(value.upgradeType === "headquarters", "expected headquarters upgrade");
			assert(value.mu === testIds.muId, "expected MU-scoped upgrade");
}, ["muId"]);

integrationTest("upgrade.getUpgradeByTypeAndEntity dormitories", async () => {
  const value = await client.upgrade.getUpgradeByTypeAndEntity({ upgradeType: "dormitories", muId: testIds.muId });

			assert(isObject(value), "expected object response");
			assert(value.upgradeType === "dormitories", "expected dormitories upgrade");
			assert(value.mu === testIds.muId, "expected MU-scoped upgrade");
}, ["muId"]);
