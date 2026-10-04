import { integrationTest, assert, isObject, client, countryId } from "./helpers/context";

integrationTest("tradingOrder.getPublicOrdersByOwner", async () => {
  const value = await client.tradingOrder.getPublicOrdersByOwner({ countryId });

			assert(Array.isArray(value.buyOrders), "expected buyOrders array");
			assert(Array.isArray(value.sellOrders), "expected sellOrders array");
			assert(Array.isArray(value.allOrders), "expected allOrders array");
			assert(typeof value.totalBuyMoneyInvested === "number", "expected numeric totalBuyMoneyInvested");
			assert(isObject(value.totalSellQuantities), "expected totalSellQuantities object");
});
