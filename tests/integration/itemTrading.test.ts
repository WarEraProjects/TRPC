import { integrationTest, assert, client } from "./helpers/context";

integrationTest("itemTrading.getItemTrading", async () => {
  const value = await client.itemTrading.getItemTrading({ itemCode: "steel" });

  assert(value.itemCode === "steel", "expected the requested item");
  assert(typeof value.currentValue === "number", "expected numeric currentValue");
  assert(Array.isArray(value.values) && value.values.length > 0, "expected daily values");
  for (const day of value.values) {
    assert(typeof day.valueAt === "string", "expected string valueAt");
    assert(typeof day.avgValue === "number", "expected numeric avgValue");
    assert(typeof day.totalQuantity === "number", "expected numeric totalQuantity");
    assert(typeof day.transactionsCount === "number", "expected numeric transactionsCount");
  }
});
