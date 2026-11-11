[![Buy Dog a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/we_dog)

---

# WarEra tRPC Client
This package provides a frontend + backend compatible tRPC communication layer for the WarEra.io API.

# Why should I use this package?
[WarEra.io](https://app.warera.io) is built on tRPC, and this client gives you a contract-aware integration layer instead of “raw HTTP calls”.

You get typed procedures, batching, and rate-limit safety out of the box.

# Where can I explore endpoints?
Right here: [https://warera.realmarijn.nl/api-explorer](https://warera.realmarijn.nl/api-explorer)

## What it can do
- End-to-end TypeScript typing for inputs and responses.
- Procedure discovery via IntelliSense (no manual endpoint hunting).
- Automatic request batching to reduce network overhead and improve throughput. The API counts a batch as one request against the rate limit.
- Built-in rate limiting that follows the limit and the reset time the server reports, so your app degrades gracefully under throttling.
- Automatic retries for failed batches on dropped connections and transient HTTP failures.
- Queries are sent as POST with the input in the body, so long inputs never hit a URL length limit.
- Cancellation with an `AbortSignal` per call and an optional request timeout.
- **Automatic cursor-based pagination** with type-safe async iterators. See [Auto-Pagination Guide](./docs/AUTO_PAGINATION.md).
- Less boilerplate, fewer edge cases, faster iteration. 

## Terms of use
The game's Terms of Service, section 9.6 (in force from about 8 November 2026), allow only
documented API endpoints without the developers' written permission. Most procedures in this
SDK are not in the API's `openapi.json`. Asked about this, the WarEra developer Dog answered on
12 October 2026: a procedure that answers to a WarEra API key without a player session may be
used, and one that needs a player session may not. Every procedure in this SDK works with an
API key alone; `npm run check:procedures` checks that against the live API.

## Install
```bash
npm i @wareraprojects/api
```

The client runs on tRPC 11. Installing it also installs `@trpc/client` and `@trpc/server`:
the tRPC 11 client uses shared utilities from `@trpc/server`, and no server is started.
Both are pinned to the same exact version, because `@trpc/client` requires a `@trpc/server`
of its own version.
`@trpc/client` 11 declares TypeScript 5.7.2 or later as a peer dependency, so depending on the
project's own TypeScript and the installer's settings, npm adds a compatible TypeScript for it
or reports a peer conflict.

## Usage
```ts
import { createAPIClient } from "@wareraprojects/api";

async function main() {
  const client = createAPIClient({
    apiKey: process.env.WARERA_API_KEY
  });

  const allCountries = await client.country.getAllCountries();
  const firstId = allCountries[0]._id;

  // Multiple calls in the same tick can be batched into fewer HTTP requests.
  const [countryById, government] = await Promise.all([
    client.country.getCountryById({ countryId: firstId }),
    client.government.getByCountryId({ countryId: firstId })
  ]);

  console.log("Country details:", countryById);
  console.log("Government:", government);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### Rate limit
The API allows 100 requests per minute without a key and 500 with one (measured in November 2026).
A batch of calls counts as one request, so calls made together are cheaper than calls made one
after another. Without the `rateLimit` option the client starts at 200 requests per minute with a
key, otherwise 100, and then follows the `ratelimit-policy` header. When `ratelimit-remaining`
reaches 0 or the server answers 429, the client holds further requests until `ratelimit-reset`.
Setting `rateLimit` fixes the spacing to that value; the pause on an exhausted window still applies.

### Cancellation and timeouts
Every procedure takes an optional second argument with an `AbortSignal`. An aborted call rejects
at once. Calls made in the same tick share one HTTP request; that request is cancelled, or never
sent while it still waits for the rate limiter, once every call in it has been aborted.

```ts
const controller = new AbortController();
const user = client.user.getUserLite({ userId }, { signal: controller.signal });
controller.abort();
```

`timeoutMs` aborts an HTTP request whose response headers have not arrived in time. The timeout
counts as a transient failure, so it is retried like a dropped connection.

```ts
const client = createAPIClient({ apiKey, timeoutMs: 15000 });
```

## Custom endpoint constraints

- `election.getElections` requires `countryId`, `partyId`, or both.
- `upgradeConstruction.listConstructions` requires `regionId`, `countryId`, or both.
- `contribution.getCountryUnrestContributions` and `getRegionContributions` use
  one-based `page` pagination. The server ignores `limit` and uses 10 rows per page
  (the final page may contain fewer). These endpoints do not use cursor auto-pagination.
- `sanction.getPaginated.type` accepts uppercase `SanctionType` values such as
  `BAN`, `MUTE_USER`, and `WARN_USER`; lowercase `ban` is invalid. Its response
  `data` is a discriminated union: narrow by `data.type` to access action fields
  such as `durationInHours`, `unMuteAt`, `removeDamages`, `oldUsername`,
  `newUsername`, and `message`.
- `tradingOrder.getTopOrdersPerItemCode` returns one `{ buyOrders, sellOrders }`
  book per requested code; a code without orders, or an unknown one, gets two
  empty lists. `limit` counts orders per side; without it the server returns one.
- `itemTrading.getItemTrading` answers 404 `NOT_FOUND` ("Itemtradings not found.")
  for a code without a trading record, such as `toolbox`.
- `gameStat.getPpMoneyValue` takes no input, and the server rejects `{}`. It is
  in `VOID_INPUT_PROCEDURES`, so the client sends no input for it.
- `employee.*` and `employeeEvent.*` need an API key; without one they answer 401
  `API token required`. `employee.getMyEmployees`, `getMyWorkforceSummary`,
  `employeeEvent.getMine` and `getPendingCount` read the key owner's workforce.
  `employeeEvent.getHistory` is for the key owner's employees; another owner's
  employee returned an empty list in one check. The company procedures and
  `employee.getById` accept any company or employee, and `getById` answers `null`
  for an unknown id.
- In `estimate` and the `hourly` totals, `production` is production points per hour,
  not money; wages and costs are money per hour.
- `gameStat.getPpMoneyValueByItem` takes no input and the server rejects `{}`, so it
  is in `VOID_INPUT_PROCEDURES` too.
- `manager.getByCompanyId` and `managerOffer.getByCompanyId` answer `null` when the
  company has no manager or no open offer. `managerOffer.getManyPaginated` takes a
  `limit` from 1 to 50 (20 without it) and an optional `countryId`, and lists the
  highest `maxHourlyWage` first. `managerOffer.getWageStats` takes an optional
  `profile: { management, citizenship? }`; without one, `topEligibleOffer` is `null`.
- `company.getProductionBonus` and `company.getRecommendedRegionIdsByItemCode` are legacy:
  the v0.27 game update (26 Oct 2026) removed deposits and the strategic-resource production
  bonus for companies. Both still answer. On 2026-11-04 the first returned `depositBonus` and
  `total` of 0 for all 24 companies of 15 owners checked, and the second an empty list for all
  13 item codes tried. Their types are marked `@deprecated`.
- A tournament in registration has no `rounds` or `activeRound` yet, and no teams, so
  `tournament.getLastTournament` may return one without them.
- `shop.getTopGiftGivers` rows carried only `_id` and `giftCount` on 2026-11-04; `username`
  stays optional in the type.
- The response types were rechecked against live responses on 2026-11-04. Fields the API no
  longer returns are gone from the types; most belong to mechanics v0.27 removed (player
  workers and work offers, hiring, party ethics, deposits, production bonuses).
- `user.getUserLite` no longer returns `skills` or `skillsExpiration`: read them from
  `user.getUserSkills`, which also returns `leveling`. `user.getUserById` still carries the
  same `skills`.
- `gameStat.getBadgeStats` and `gameStat.getMilestoneStats` take no input and the server
  rejects `{}`, so they are in `VOID_INPUT_PROCEDURES` as well.
- The `articleInteraction.*` procedures return the whole list, newest first; the server
  ignores `limit` and `cursor`.
- `mercenaryContractAuction.getActiveAuctions` lists open auctions only, newest first, 20 per
  page without a `limit`. It filters by `countryId` and `battleId` and ignores `status`.
- `upgrade.getMapUpgrades` (every building on the map) was about 175 KB and `map.getMapData`
  (the world map as TopoJSON) about 2.7 MB on 2026-11-09.
- `user.getTodayClaimCount` returned the same number with and without an API key, so it is not
  the key owner's count. `poll.getPoll` returns the API key owner's vote in `myVote`; without a
  key it is `null`.
- In `map.getMapData`, decode arcs with the topology's `transform`, but read `Point` coordinates
  (region and country labels) as they are: they are already longitude and latitude.
- The procedures added on 2026-11-09 (`articleInteraction.*`, `battle.getActiveBattlesByCountry`,
  `battle.getViewersCount`, `map.getMapData`, `mercenaryContractAuction.getActiveAuctions`,
  `mu.getReputationBuyStatus`, `party.getInactiveMemberIds`, `upgrade.getMapUpgrades`,
  `user.getUserSkills`, `user.getTodayClaimCount`, and the two `gameStat` stats) all answer
  without an API key.
- Five more were added on 2026-11-10, found by comparing the queries the web client calls with
  this package: `article.getPinnedArticles`, `assetSale.getLastSkinGifts`,
  `alliance.getStrategicResourceBonuses`, `country.getStrategicResourceBonuses` and
  `government.getCongressSeats`. They answer without an API key. Of the other 71 untyped
  queries tried without credentials that day, every one answered `UNAUTHORIZED`, and the four
  tried with an API key answered "API tokens cannot access this endpoint".
- `country.getStrategicResourceBonuses` returns the alliance's bonuses for a member of an
  alliance. A country outside every alliance gets its own, or `null` when it holds no strategic
  resource.

## Auto-Pagination

For endpoints that support cursor-based pagination, use the `autoPaginate` flag to automatically iterate through all pages:

```ts
import { createAPIClient } from "@wareraprojects/api";

async function main() {
  const client = createAPIClient({
    apiKey: process.env.WARERA_API_KEY
  });

  // Automatically paginate through all articles
  for await (const page of client.article.getArticlesPaginated({
    type: "last",
    limit: 50,
    autoPaginate: true,
    maxPages: 20  // Optional: limit to 20 pages
  })) {
    console.log(`Processing ${page.items.length} articles`);
    page.items.forEach(article => {
      console.log(`- ${article.title}`);
    });
  }
}

main().catch(console.error);
```

See the [Auto-Pagination Guide](./docs/AUTO_PAGINATION.md) for more details and advanced usage patterns.

---

Found an issue?
Open up a ticket here: https://github.com/WarEraProjects/TRPC/issues

## Testing

`npm test` runs the offline unit suite in `tests/unit` with mocked fetch responses.
It needs no API key, `.env`, response cache, or live API access. The suite covers
transport retries, cursor pagination, custom endpoint input handling, and void-input
procedures. Compile-time checks also verify required inputs, pagination overloads,
response shapes, and custom endpoint type contracts.

| Command | Purpose |
|---|---|
| `npm test` / `npm run test:unit` | Run all offline unit tests. |
| `npm run test:retry` | Run only offline retry tests. |
| `npm run test:integration:pagination` | Run bounded live pagination checks. |
| `npm run test:integration:custom` | Validate custom endpoints against the live API. |
| `npm run test:integration` | Run all live integration tests by API area. |
| `npm run benchmark:api` | Run the former default test: a live countries/users/companies crawl. |
| `npm run check:procedures` | Check every SDK procedure against the live API: gone, needs a session, or newly documented. One request of the rate limit per 50 procedures. `-- --also a.b,c.d` probes further names. |

Live commands load `.env` using dotenv. Copy `.env-example` to `.env` and set
`WARERA_API_KEY`. Exported environment variables also work; if your key is in
`~/.bashrc`, run the suite from an interactive Bash shell (`bash -ic 'npm run test:integration'`).
Missing test IDs are discovered through `search.searchAnything`: the default
username is `Dog`, or set `WARERA_TEST_USERNAME` to another exact, case-sensitive
username. The setup fetches search results' user profiles and requires exactly
one matching username. It uses that user's MU and selects the first company from
`company.getCompanies`. `WARERA_COMPANY_ID`, `WARERA_MU_ID`, and `WARERA_USER_ID`
override discovery; existing samples in `Responses/outputs` also take precedence.
When a user ID is supplied, related IDs are discovered from that user's profile.
Only IDs required by a selected test are resolved. Discovery depends on the
account's current MU membership and companies. `WARERA_EMPLOYEE_ID` selects the
employee used by employee tests (default: the API key owner's first employee).
`WARERA_COUNTRY_ID` overrides the default country ID, `6813b6d446e731854c7ac7a0`.

To pin the live entities found for `Dog` on 2026-10-05, export these variables
in your shell or put the assignments in `.env` (without `export`):

```bash
export WARERA_USER_ID=690d6b03becd7485dbb33b05
export WARERA_MU_ID=694ce4f14bff8f86caa9e8e2
export WARERA_COMPANY_ID=690d6b03becd7485dbb33b2c
```

The company belongs to `Dog`. MU membership and company ownership can change;
remove these overrides to rediscover current entities.

The `work.getStatsByUserId` and `work.getStatsByCompany` checks need a WarEra
Premium API key; normal keys receive HTTP 403 `Premium required`, and these checks
are then reported as skipped. Any other error, and `Premium required` on a check that
is not marked `premium`, still fails the run.

The API benchmark can make many requests and is intended for deliberate manual
runs. It is separate from both unit and integration testing. Response collection
and type generation remain separate maintenance commands.

Integration tests are grouped by API area in `tests/integration/*.test.ts`.
Each endpoint has an individual Node test-runner result. Shared client and ID
lookup helpers live in `tests/integration/helpers`; IDs are required only by the
checks that use them. Suites run one file at a time to limit concurrent API traffic.
Each check has a 60-second timeout. Missing credentials or required IDs fail with
setup instructions; failures are not silently skipped.

Run one API area:

```bash
node --import tsx --require dotenv/config --test tests/integration/company.test.ts
```

Set `WARERA_API_URL` to override the integration client's tRPC base URL.

## Type checking

Run `npm run typecheck` to check the library, all unit and integration tests,
benchmarks, response-generation tools, and the build configuration. These checks
only compile types: they emit no files, make no API requests, and need no credentials.

| Command | Configuration | Scope |
|---|---|---|
| `npm run typecheck:src` | `tsconfig.json` | Library source and declarations. |
| `npm run typecheck:tests` | `tsconfig.tests.json` | All tests, shared helpers, and benchmarks. |
| `npm run typecheck:tools` | `tsconfig.tools.json` | Response collection/generation, `scripts/` and `tsup.config.ts`. |

The test and tool configurations inherit the library's strict compiler settings.
Node-based tools use ES2022 to support `Object.hasOwn`; the library remains ES2020.
Raw response outputs and backups are excluded from the tool check. The package
build continues to use `tsconfig.json` and bundles only the library entry point.
