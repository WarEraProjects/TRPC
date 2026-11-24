import { integrationTest, assert, isObject, client } from "./helpers/context";

/** The country with the most active sponsorships among the top 10 by damage. */
let sponsoringCountry: Promise<string> | undefined;
function getSponsoringCountry() {
  return sponsoringCountry ??= (async () => {
    const { items } = await client.ranking.getRankingPage({ rankingType: "countryDamages", limit: 10 });
    let best = { countryId: items[0]?.country ?? "", active: -1 };
    for (const { country } of items) {
      if (!country) continue;
      const { active } = await client.muSponsorship.getByCountry({ countryId: country });
      if (active.length > best.active) best = { countryId: country, active: active.length };
    }
    assert(best.countryId, "expected a country");
    return best.countryId;
  })();
}

integrationTest("muSponsorship.getByCountry and getForMu", async () => {
  const countryId = await getSponsoringCountry();
  const value = await client.muSponsorship.getByCountry({ countryId });

  assert(Array.isArray(value.active) && Array.isArray(value.offered) && Array.isArray(value.past), "expected the three lists");
  assert(isObject(value.mus), "expected the MUs by id");
  for (const sponsorship of [...value.active, ...value.offered]) {
    assert(sponsorship.country === countryId, "expected the country's sponsorships");
    assert(Array.isArray(sponsorship.kickedUsers) && typeof sponsorship.live === "boolean", "expected kickedUsers and live");
    assert(isObject(value.mus[sponsorship.mu]), "expected the MU in mus");
  }

  const [sponsorship] = value.active;
  if (sponsorship) {
    const forMu = await client.muSponsorship.getForMu({ muId: sponsorship.mu });
    assert(forMu?._id === sponsorship._id, "expected the MU's active sponsorship");
  }
  assert(await client.muSponsorship.getForMu({ muId: "000000000000000000000000" }) === null, "expected null for an unknown MU");
});

integrationTest("muSponsorship.getActiveByCountryPaginated", async () => {
  const countryId = await getSponsoringCountry();
  const pages = [];
  for await (const page of client.muSponsorship.getActiveByCountryPaginated({ countryId, limit: 2, autoPaginate: true, maxPages: 3 })) {
    pages.push(page.items);
  }
  const items = pages.flat();
  assert(items.every((item) => item.status === "active" && item.country === countryId), "expected the country's active sponsorships");
  for (let i = 1; i < items.length; i++) {
    assert(items[i - 1].acceptedAt! <= items[i].acceptedAt!, "expected the oldest acceptedAt first");
  }
});

integrationTest("muSponsorship.getSponsorable", async () => {
  const value = await client.muSponsorship.getSponsorable({ countryId: await getSponsoringCountry(), searchText: "a" });

  assert(Array.isArray(value), "expected a list");
  for (const mu of value) assert(typeof mu._id === "string" && typeof mu.name === "string" && Number.isInteger(mu.membersCount), "expected id, name and membersCount");
});
