# Changelog

## 0.5.0 (unreleased)

This release follows the game's v0.27 patch, which removed the old work system. Code
that used the removed procedures or types has to change, hence the minor version bump.

### Breaking changes
- Removed the procedures the API no longer serves: `worker.getTotalWorkersCount`,
  `worker.getWorkers`, `work.getStatsByWorker`, `work.getStatsByWorkerAndCompany` and the
  `workOffer.*` procedures. Their types are gone too, among them `WorkerGetWorkersResponse`,
  `WorkOfferListItem`, `WorkOfferGetWageStatsResponse` and `WorkOfferCustomEndpoints`.
- Response types were corrected against live responses. `CompanyDates`,
  `CountryResourceBonuses`, `GameConfigWorker`, `PartyEthics`, `RegionDeposit` and
  `RegionResourceBonusByTier` no longer exist; `company.getProductionBonus` returns only
  `depositBonus` and `total`.
- The client runs on tRPC 11. `@trpc/client` and `@trpc/server` are pinned to 11.24.0, and
  `@trpc/client` 11 expects TypeScript 5.7.2 or later.
- Without the `rateLimit` option the client now follows the limit the server reports. With
  an API key that is 500 requests per minute instead of the fixed 200 before.
- HTTP 409 is no longer retried by default.
- `cursorEnd` throws a `RangeError` when it is not a valid date.

### Added
- New procedures: the `employee.*` and `employeeEvent.*` procedures (they need an API key),
  `manager.getByCompanyId`, `managerOffer.getByCompanyId`, `managerOffer.getManyPaginated`,
  `managerOffer.getWageStats`, `itemTrading.getItemTrading`,
  `tradingOrder.getTopOrdersPerItemCode`, `gameConfig.getMaxBountyRate`,
  `gameStat.getPpMoneyValue`, `gameStat.getPpMoneyValueByItem` and `article.getPinnedArticles`.
- Every procedure takes an optional second argument `{ signal }` to abort the call.
- `timeoutMs` aborts and retries a request whose response headers do not arrive in time.
- The rate limiter holds further requests until `ratelimit-reset` when the window is used up
  or the server answers 429.
- `npm run check:procedures` checks every procedure of the SDK against the live API.

### Fixed
- `await` on a client, for example one returned from an async function, no longer hangs.
- The rate limiter no longer waits for each response before it starts the next request, and
  a fetch that throws synchronously no longer stops the queue.
- `cursorEnd` works with the API's current `v2.` cursors; before, it never stopped a crawl.
- Retries follow `Retry-After`, give up at once when the caller aborts, and return a 429
  whose reset is longer than `maxDelayMs` instead of spending the remaining attempts.
- A batch answered with an HTML error page fails only its own calls, with the HTTP status
  in the error.
- `CustomEndpointDefinition` with an `input` now types that input.
- Inputs with their own `toJSON()` are sent unchanged.

### Internal
- `maxBatchSize` now uses tRPC's `maxItems`, and queries go out as POST through tRPC's
  `methodOverride`. The hand-built batch splitter and GET-to-POST conversion are gone.
- The publish workflow runs the type checks and unit tests before it publishes, and a
  pre-release goes out under the `next` dist-tag.
