# Changelog

## Unreleased

### Breaking changes
- Removed `sanction.getPaginated`, which the API no longer serves, together with its types
  `Sanction`, `SanctionData`, `SanctionDestroyedItem`, `SanctionType`,
  `SanctionGetPaginatedInput`, `SanctionGetPaginatedResponse` and `SanctionCustomEndpoints`.
  The game now reads `sanction.getUserSanctions`, which refuses API keys, so there is no
  replacement.
- `RankingGetRankingResponse` follows the live response: `_id`, `__v` and `isGlobal` are gone,
  and `count`, `updatedAt` and an optional `zeroRank` are new. `RankingItem` has a `type`.
  `ranking.getRanking` returns the top 100 entries; `ranking.getRankingPage` has the rest.

### Added
- `ranking.getRankingPage` pages through a whole ranking by cursor, also with `autoPaginate`,
  and can keep the players of one country or MU. `ranking.getRankingAround` returns one entry
  with its neighbours. New types: `RankingDetails`, `RankingGetRankingPageResponse` and
  `RankingGetRankingAroundResponse`.
- The OpenAPI types follow the live spec: `battle.getBattles` takes `allianceId`, and
  `rankingType` accepts `userMercenaryEarnings` and `muMercenaryEarnings`.
- Sixteen public procedures, found on 2026-11-24 by comparing the game client's queries with
  this package. They are typed from live responses and have integration tests, and all of
  them answer with and without an API key:
  - `battleRanking.getPrivateMercenaryDamage`
  - `league.getUserLeague`
  - `mercenaryContractAuction.getBidEligibility`
  - `muLeague.getDivisionCounts` and `muLeague.getMuLeague`
  - the MU sponsorships: `muSponsorship.getByCountry`, `getActiveByCountryPaginated`,
    `getForMu` and `getSponsorable`
  - the daily ranking snapshots: `rankingSnapshot.getEntityRecentRanks`, `getHistory` and
    `getPreviousRanks`
  - a country's military spending: `stateArmyExpense.getOverview` and `getLedger`
  - gift drops: `subGiftDrop.getView` and `getEntrants`

  `RankingType` names every ranking. `muSponsorship.getActiveByCountryPaginated`,
  `stateArmyExpense.getLedger` and `subGiftDrop.getEntrants` support `autoPaginate`.
- The response crawler (`npm run allEndpoints`) also fetches `ranking.getRankingPage` and
  `ranking.getRankingAround`.

### Fixed
- `npm run openapi` works again. The live spec has `$ref`s relative to a request body's own
  schema, which openapi-typescript cannot resolve; `scripts/generate-openapi.ts` inlines them
  before generating.
- Auto-pagination:
  - A crawl ends when the server returns a cursor it was already sent. Without `maxPages`, a
    repeated cursor used to be requested forever.
  - `autoPaginate`, `maxPages` and `cursorEnd` are type errors on a procedure without a
    cursor, also when the input is held in a variable. Such a call used to compile as a
    Promise and return an iterator that yielded a page without items; with `autoPaginate: true`
    it now throws a `TypeError` that names the procedure.
  - A fractional `maxPages` is rounded down; `1.5` used to fetch two pages.
  - `cursorEnd` no longer reads a `"{number}|{id}"` cursor as a year, and an id that merely
    contains the text `undefined` no longer ends a crawl.
  - `PageResult` accepts the packaged custom procedures, as the guide said:
    `PageResult<"giveaway.getManyPaginated">`.
  - The guide: `page.cursor` is `""` only when the list ended, `ranking.getRankingPage` runs
    best rank first, and `direction` changed nothing on the four lists that take it.

## 0.5.0

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
- Response types follow the drift since v0.27 (#51): `user.getUserLite` no longer has
  `skills` or `skillsExpiration` (use `user.getUserSkills`), `MuGetByIdResponse` is now
  `MuListItem`, and `gameConfig` lost `government.memberWagePercent`, the resistance
  cooldowns and the `region` resistance fields.
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
  `gameStat.getPpMoneyValue` and `gameStat.getPpMoneyValueByItem`.
- Twenty public procedures from #51: `articleInteraction.getArticleLikers`,
  `getArticleDislikers`, `getArticleTippers` and `getArticleGemTippers`,
  `battle.getActiveBattlesByCountry`, `battle.getViewersCount`, `gameStat.getBadgeStats`,
  `gameStat.getMilestoneStats`, `map.getMapData`, `mercenaryContractAuction.getActiveAuctions`,
  `mu.getReputationBuyStatus`, `party.getInactiveMemberIds`, `upgrade.getMapUpgrades`,
  `user.getUserSkills`, `user.getTodayClaimCount`, `article.getPinnedArticles`,
  `assetSale.getLastSkinGifts`, `alliance.getStrategicResourceBonuses`,
  `country.getStrategicResourceBonuses` and `government.getCongressSeats`.
- Response types for `poll.getPoll` and `poll.getPollVoters`.
- Every procedure takes an optional second argument `{ signal }` to abort the call.
- `timeoutMs` aborts and retries a request whose response headers do not arrive in time.
- The rate limiter holds further requests until `ratelimit-reset` when the window is used up
  or the server answers 429.
- `npm run check:procedures` checks every procedure of the SDK against the live API.

### Fixed
- `await` on a client, for example one returned from an async function, no longer hangs.
- The rate limiter no longer waits for each response before it starts the next request, and
  a fetch that throws synchronously no longer stops the queue.
- `cursorEnd` works with the API's current `v2.` cursors, including date keys sent as strings
  and leading `null` keys (#51); before, it never stopped a crawl.
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
- Pull requests run the type checks, unit tests and build (#52).
