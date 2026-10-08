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
