import { integrationTest, assert, client } from "./helpers/context";

integrationTest("gameConfig.getMaxBountyRate", async () => {
  const value = await client.gameConfig.getMaxBountyRate();

  assert(typeof value === "number", "expected numeric max bounty rate");
  assert(value > 0, "expected positive max bounty rate");
});
