import { integrationTest, assert, client } from "./helpers/context";

integrationTest("managerOffer.getWageStats", async () => {
  const value = await client.managerOffer.getWageStats();

			const { min, average, max } = value.allowedRange;
			assert(min <= average && average <= max, "expected min <= average <= max");
			assert(typeof value.topOffer === "number", "expected numeric topOffer");
			assert(value.topEligibleOffer === null, "expected no eligible offer without a profile");
});

integrationTest("managerOffer.getWageStats with a profile", async () => {
  const value = await client.managerOffer.getWageStats({ profile: { management: 10 } });

			assert(value.topEligibleOffer === null || typeof value.topEligibleOffer === "number", "expected a numeric or null topEligibleOffer");
});

integrationTest("managerOffer.getManyPaginated", async () => {
  const value = await client.managerOffer.getManyPaginated({ limit: 5 });

			assert(Array.isArray(value.items) && value.items.length <= 5, "expected at most 5 offers");
			for (const [index, offer] of value.items.entries()) {
				assert(typeof offer.company === "string", "expected string company");
				assert(typeof offer.maxHourlyWage === "number", "expected numeric maxHourlyWage");
				if (index > 0) assert(value.items[index - 1].maxHourlyWage >= offer.maxHourlyWage, "expected the highest wage first");
			}
});

integrationTest("managerOffer.getByCompanyId", async () => {
  const { items } = await client.managerOffer.getManyPaginated({ limit: 5 });
  assert(items.length > 0, "expected at least one open manager offer");
  // An offer can close between the two reads, so any listed company's offer will do.
  let found = false;
  for (const { company: companyId } of items) {
    const value = await client.managerOffer.getByCompanyId({ companyId });
    assert(value === null || value.company === companyId, "expected null or the company's offer");
    if (value) { found = true; break; }
  }

			assert(found, "expected a listed company's offer");
});
