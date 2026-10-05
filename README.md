[![Buy Dog a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/we_dog)

---

# WarEra tRPC Client
This package provides a frontend + backend compatible tRPC communication layer for the WarEra.io API.

# Why should I use this package?
[WarEra.io](https://app.warera.io) is built on tRPC, and this client gives you a contract-aware integration layer instead of “raw HTTP calls”.

You get typed procedures, batching, and rate-limit safety out of the box.

## What it can do
- End-to-end TypeScript typing for inputs and responses.
- Procedure discovery via IntelliSense (no manual endpoint hunting).
- Automatic request batching to reduce network overhead and improve throughput.
- Built-in rate limiting aligned to API requirements, so your app degrades gracefully under throttling.
- Automatic retries for failed batches on dropped connections and transient HTTP failures.
- Automatic URL length handling by splitting oversized requests and recombining results.
- **Automatic cursor-based pagination** with type-safe async iterators. See [Auto-Pagination Guide](./docs/AUTO_PAGINATION.md).
- Less boilerplate, fewer edge cases, faster iteration. 

## Install
```bash
npm i @wareraprojects/api
```

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

## Custom endpoint constraints

- `worker.getWorkers` requires `companyId`, `userId`, or both. The company selector
  takes precedence and returns `{ type: "company", workers }`; user-only selection
  returns `{ type: "user", workersPerCompany }`. Narrow by `type` before reading rows.
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
retry behavior and the client's pagination implementation.

| Command | Purpose |
|---|---|
| `npm test` / `npm run test:unit` | Run all offline unit tests. |
| `npm run test:retry` | Run only offline retry tests. |
| `npm run test:integration:pagination` | Run bounded live pagination checks. |
| `npm run test:integration:custom` | Validate custom endpoints against the live API. |
| `npm run test:integration` | Run both live integration suites. |
| `npm run benchmark:api` | Run the former default test: a live countries/users/companies crawl. |

Live commands load `.env` using dotenv. Copy `.env-example` to `.env` and set
`WARERA_API_KEY`. Exported environment variables also work; if your key is in
`~/.bashrc`, run the suite from an interactive Bash shell (`bash -ic 'npm run test:integration'`).
Missing test IDs are discovered through `search.searchAnything`: the default
username is `Dog`, or set `WARERA_TEST_USERNAME` to another exact, case-sensitive
username. The setup fetches search results' user profiles and requires exactly
one matching username. It uses that user's MU and selects a company with a worker
from `worker.getWorkers`, keeping the company and worker paired. Company-only
checks can fall back to `company.getCompanies` if no worker is available.
`WARERA_COMPANY_ID`, `WARERA_MU_ID`, `WARERA_USER_ID`, and `WARERA_WORKER_ID`
override discovery; existing samples in `Responses/outputs` also take precedence.
When a user ID is supplied, related IDs are discovered from that user's profile.
Only IDs required by a selected test are resolved. Discovery depends on the
account's current MU membership, companies, and workers.

To pin the live entities found for `Dog` on 2026-10-05, export these variables
in your shell or put the assignments in `.env` (without `export`):

```bash
export WARERA_USER_ID=690d6b03becd7485dbb33b05
export WARERA_MU_ID=694ce4f14bff8f86caa9e8e2
export WARERA_COMPANY_ID=690d6b03becd7485dbb33b2c
export WARERA_WORKER_ID=690efde8fa2a3c7c37ee867d
```

The company belongs to `Dog`; the worker ID identifies a user employed at that
company. Membership and employment can change; remove these overrides to
rediscover current entities.

`WARERA_WORKER_ID` is the worker's user id (the `user` field of a
`worker.getWorkers` entry), which is what the `work.*` procedures key on. The
`work.getStatsByWorker`, `work.getStatsByUserId`, and `work.getStatsByCompany`
checks need a WarEra Premium API key; normal keys receive HTTP 403
`Premium required`. `work.getStatsByWorkerAndCompany` has been reported to
return HTTP 401 even with an API key, suggesting it requires session authentication.
The configured key passed all five work checks, including worker-and-company,
on 2026-10-05, so that session restriction is not universal.
The live work suite checks successful responses and will fail when the supplied
credentials cannot access an endpoint.

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
| `npm run typecheck:tools` | `tsconfig.tools.json` | Response collection/generation and `tsup.config.ts`. |

The test and tool configurations inherit the library's strict compiler settings.
Node-based tools use ES2022 to support `Object.hasOwn`; the library remains ES2020.
Raw response outputs and backups are excluded from the tool check. The package
build continues to use `tsconfig.json` and bundles only the library entry point.
