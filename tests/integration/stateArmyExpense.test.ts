import { integrationTest, assert, client, countryId } from "./helpers/context";

const KINDS = ["hqOil", "contract", "sponsorLaw", "revokeLaw"];

integrationTest("stateArmyExpense.getOverview", async () => {
  const week = await client.stateArmyExpense.getOverview({ countryId, days: 7 });
  const allTime = await client.stateArmyExpense.getOverview({ countryId });

  for (const value of [week, allTime]) {
    for (const total of [...value.byKind, ...value.byUnit, ...value.byDay]) {
      assert(KINDS.includes(total.kind), `unexpected kind ${total.kind}`);
      assert(typeof total.quantity === "number" && typeof total.money === "number", "expected quantity and money");
    }
    for (const unit of value.byUnit) assert(typeof unit.mu === "string", "expected an MU id");
  }
  for (const day of week.byDay) assert(/^\d{4}-\d{2}-\d{2}$/.test(day.day), "expected the day");
  assert(allTime.byDay.length === 0, "expected no days without `days`");
});

integrationTest("stateArmyExpense.getLedger", async () => {
  const items = [];
  for await (const page of client.stateArmyExpense.getLedger({ countryId, limit: 10, autoPaginate: true, maxPages: 2 })) {
    items.push(...page.items);
  }
  for (const [index, entry] of items.entries()) {
    assert(entry.country === countryId && KINDS.includes(entry.kind), "expected the country's expenses");
    assert(typeof entry.at === "string" && /^\d{4}-\d{2}-\d{2}$/.test(entry.day), "expected at and day");
    if (index > 0) assert(items[index - 1].at >= entry.at, "expected the newest first");
  }

  const oil = await client.stateArmyExpense.getLedger({ countryId, kind: "hqOil", limit: 5 });
  assert(oil.items.every((entry) => entry.kind === "hqOil" && typeof entry.quantity === "number"), "expected HQ oil entries with a quantity");
});
