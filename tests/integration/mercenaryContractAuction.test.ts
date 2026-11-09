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
  assert(auction, "expected at least one open auction");
  const value = await client.mercenaryContractAuction.getActiveAuctions({ battleId: auction.battle, limit: 50 });

  assert(value.items.every((item) => item.battle === auction.battle), "expected only that battle's auctions");
});
