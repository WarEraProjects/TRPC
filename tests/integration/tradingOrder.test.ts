import { integrationTest, assert, isObject, client, countryId, testIds } from "./helpers/context";

integrationTest("tradingOrder.getPublicOrdersByOwner", async () => {
  const value = await client.tradingOrder.getPublicOrdersByOwner({ countryId });

  assert(Array.isArray(value.buyOrders), "expected buyOrders array");
  assert(Array.isArray(value.sellOrders), "expected sellOrders array");
  assert(Array.isArray(value.allOrders), "expected allOrders array");
  assert(typeof value.totalBuyMoneyInvested === "number", "expected numeric totalBuyMoneyInvested");
  assert(typeof value.totalSellMoneyExpected === "number", "expected numeric totalSellMoneyExpected");
  assert(isObject(value.totalSellQuantities), "expected totalSellQuantities object");
  for (const order of value.allOrders) {
    assert(typeof order.user === "string", "expected string user on country order");
    assert(typeof order.country === "string", "expected string country on country order");
  }
});

integrationTest("tradingOrder.getPublicOrdersByOwner by user", async () => {
  const value = await client.tradingOrder.getPublicOrdersByOwner({ userId: testIds.userId });

  assert(Array.isArray(value.allOrders), "expected allOrders array");
  for (const order of value.allOrders) {
    assert(typeof order.user === "string", "expected string user on user order");
    assert(order.type === "buy" || order.type === "sell", "expected order type");
  }
}, ["userId"]);

integrationTest("tradingOrder.getTopOrdersPerItemCode", async () => {
  const itemCodes = ["scraps", "steel"];
  const value = await client.tradingOrder.getTopOrdersPerItemCode({ itemCodes, limit: 5 });

  for (const itemCode of itemCodes) {
    const book = value[itemCode];
    assert(isObject(book), `expected a book for ${itemCode}`);
    assert(Array.isArray(book.buyOrders) && book.buyOrders.length <= 5, `expected at most 5 buy orders for ${itemCode}`);
    assert(Array.isArray(book.sellOrders) && book.sellOrders.length <= 5, `expected at most 5 sell orders for ${itemCode}`);
    for (const [side, orders] of [["buy", book.buyOrders], ["sell", book.sellOrders]] as const) {
      for (const order of orders) {
        assert(order.type === side, `expected ${side} orders on the ${side} side`);
        assert(order.itemCode === itemCode, `expected only ${itemCode} orders in its book`);
        assert(typeof order.price === "number", "expected numeric price");
        assert(typeof order.quantity === "number", "expected numeric quantity");
      }
    }
  }
});
