import { integrationTest, assert, client, testIds } from "./helpers/context";

integrationTest("mu.getReputationBuyStatus", async () => {
  const [status, mu] = await Promise.all([
    client.mu.getReputationBuyStatus({ muId: testIds.muId }),
    client.mu.getById({ muId: testIds.muId }),
  ]);

  assert(typeof status.canBuy === "boolean", "expected boolean canBuy");
  assert(typeof status.cost === "number" && typeof status.amount === "number", "expected numeric cost and amount");
  assert(status.currentReputation === mu.mercenaryReputation, "expected the MU's mercenaryReputation");
}, ["muId"]);
