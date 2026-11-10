import { integrationTest, assert, client } from "./helpers/context";

integrationTest("mercenaryContractAuction.getActiveAuctions", async () => {
  const value = await client.mercenaryContractAuction.getActiveAuctions({ limit: 5 });

  assert(Array.isArray(value.items) && value.items.length <= 5, "expected at most 5 auctions");
  for (const [index, auction] of value.items.entries()) {
    assert(auction.status === "active", "expected open auctions only");
    if (index > 0) assert(value.items[index - 1].createdAt >= auction.createdAt, "expected the newest first");
  }
});

integrationTest("mercenaryContractAuction.getActiveAuctions by battle", async () => {
  const { items: [auction] } = await client.mercenaryContractAuction.getActiveAuctions({ limit: 1 });
  // Open auctions come and go: on 2026-11-10 there was none for a while. A battle id that matches
  // no auction still has to give an empty list.
  const battleId = auction?.battle ?? "000000000000000000000000";
  const value = await client.mercenaryContractAuction.getActiveAuctions({ battleId, limit: 50 });

  assert(value.items.every((item) => item.battle === battleId), "expected only that battle's auctions");
});
