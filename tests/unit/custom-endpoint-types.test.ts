import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  APIClient,
  PublicTradingOrder,
  Region,
  RegionActiveBattle,
  SanctionData,
  TournamentMatch,
  WorkStatsItem,
} from "../../src";

// Compile-time checks: `npm run typecheck:tests` fails if any directive below becomes unused
// or any call stops type-checking. `typeOnly` is never invoked, so nothing reaches the API.

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;

export function typeOnly(client: APIClient) {
  // Required inputs are enforced for custom and OpenAPI-derived procedures alike.
  // @ts-expect-error allianceId is required
  void client.alliance.getById();
  // @ts-expect-error electionId is required
  void client.election.getElection();
  // @ts-expect-error userId is required
  void client.user.getUserById();

  // One-of inputs reject the empty filter and accept either side.
  // @ts-expect-error countryId or partyId is required
  void client.election.getElections({ limit: 5 });
  void client.election.getElections({ countryId: "c" });
  void client.election.getElections({ partyId: "p", limit: 5, direction: "forward" });
  void client.election.getElections({ countryId: "c", partyId: "p" });
  // @ts-expect-error regionId or countryId is required
  void client.upgradeConstruction.listConstructions({ limit: 5 });
  void client.upgradeConstruction.listConstructions({ countryId: "c", limit: 5 });
  void client.upgradeConstruction.listConstructions({ regionId: "r" });

  // Pagination overloads survive the one-of union.
  void client.election.getElections({ countryId: "c", autoPaginate: true, maxPages: 1 });
  void client.upgradeConstruction.listConstructions({ countryId: "c", autoPaginate: true });

  // No-input procedures stay callable without an argument.
  void client.gameStat.getWorldDevelopment();
  void client.region.getAll();
  void client.shop.getLastGifts();

  // Parameters the server ignores are not part of the input types.
  // @ts-expect-error page is not a server parameter
  void client.alliance.getManyPaginated({ page: 2 });
  // @ts-expect-error count is not a server parameter
  void client.company.getRecommendedRegionIdsByItemCode({ itemCode: "wood", count: 3 });
}

// Response shapes.
type _activeBattle = Expect<Equal<Region["activeBattle"], RegionActiveBattle | undefined>>;
type _population = Expect<Equal<Region["currentPopulation"], number>>;
type _orderCountry = Expect<Equal<PublicTradingOrder["country"], string | undefined>>;
type _workWage = Expect<Equal<WorkStatsItem["wage"], number | undefined>>;
type _wonBy = Expect<Equal<TournamentMatch["wonBy"], "attacker" | "defender" | undefined>>;

function describeSanction(data: SanctionData): string {
  switch (data.type) {
    case "BAN":
      return `${data.reason} for ${data.banDurationInDays} days`;
    case "WARN_USER":
      return data.message;
    case "CANCEL_TRADING_ORDER":
      return `${data.orderType} ${data.quantity} ${data.itemCode}`;
    default:
      return data.type;
  }
}

test("custom endpoint type contracts compile", () => {
  assert.equal(describeSanction({ type: "WARN_USER", message: "x" }), "x");
  assert.equal(describeSanction({ type: "BAN", reason: "multi", banDurationInDays: 7, unbannedAt: "2026-01-01T00:00:00.000Z" }), "multi for 7 days");
});
