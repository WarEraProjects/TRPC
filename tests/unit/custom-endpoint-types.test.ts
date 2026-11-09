import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  APIClient,
  BattleRankingItem,
  CompanyGetByIdResponse,
  Employee,
  EmployeeEvent,
  EmployeeEventOutcome,
  EmployeeGetCompanyRosterResponse,
  GameStatHolderCount,
  ItemTradingGetItemTradingResponse,
  ItemTradingValue,
  Manager,
  ManagerOffer,
  ManagerOfferGetManyPaginatedResponse,
  MapGetMapDataResponse,
  MapRegionProperties,
  MercenaryContractAuctionListItem,
  MuListItem,
  PartyGetByIdResponse,
  PollVote,
  PublicTradingOrder,
  Region,
  RegionActiveBattle,
  SanctionData,
  TournamentMatch,
  TradingOrderBook,
  UserGetUserByIdResponse,
  UserGetUserLiteResponse,
  UserSkills,
  WarEraCustomEndpoints,
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
  // @ts-expect-error itemCode is required
  void client.itemTrading.getItemTrading();
  // @ts-expect-error itemCodes is required
  void client.tradingOrder.getTopOrdersPerItemCode({ limit: 5 });
  // @ts-expect-error companyId is required
  void client.employee.getCompanyRoster();
  // @ts-expect-error companyId is required
  void client.employee.getCompanyEstimate({});
  // @ts-expect-error employeeId is required
  void client.employee.getById();
  // @ts-expect-error employeeId is required
  void client.employeeEvent.getHistory();
  // @ts-expect-error companyId is required
  void client.manager.getByCompanyId();
  // @ts-expect-error companyId is required
  void client.managerOffer.getByCompanyId({});
  // @ts-expect-error a profile needs its management level
  void client.managerOffer.getWageStats({ profile: {} });
  void client.managerOffer.getWageStats({ profile: { management: 10 } });
  // @ts-expect-error articleId is required
  void client.articleInteraction.getArticleLikers();
  // @ts-expect-error countryId is required
  void client.battle.getActiveBattlesByCountry({});
  // @ts-expect-error battleId is required
  void client.battle.getViewersCount();
  // @ts-expect-error muId is required
  void client.mu.getReputationBuyStatus();
  // @ts-expect-error partyId is required
  void client.party.getInactiveMemberIds();
  // @ts-expect-error userId is required
  void client.user.getUserSkills({});
  // @ts-expect-error optionId is required
  void client.poll.getPollVoters({ pollId: "p" });

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

  void client.upgradeConstruction.listConstructions({ regionId: "r", countryId: "c" });
  // @ts-expect-error a filter is required even with auto-pagination
  void client.upgradeConstruction.listConstructions({ autoPaginate: true });

  void client.sanction.getPaginated({ type: "MUTE_USER" });
  // @ts-expect-error sanction filters are case-sensitive enum values
  void client.sanction.getPaginated({ type: "ban" });
  // @ts-expect-error unknown sanction filters are rejected by the server
  void client.sanction.getPaginated({ type: "UNKNOWN_ACTION" });

  // Legitimately optional filters stay optional.
  void client.donation.getManyPaginated({ limit: 1 });
  void client.donation.getTotalDonations({});
  void client.tradingOrder.getPublicOrdersByOwner({});
  void client.tradingOrder.getTopOrdersPerItemCode({ itemCodes: ["scraps", "steel"] });
  void client.battleRanking.getRanking({ dataType: "damage", type: "user", side: "merged" });
  void client.upgrade.getUpgradeByTypeAndEntity({ upgradeType: "bunker" });

  // Pagination overloads survive the one-of union.
  void client.election.getElections({ countryId: "c", autoPaginate: true, maxPages: 1 });
  void client.upgradeConstruction.listConstructions({ countryId: "c", autoPaginate: true });
  void client.managerOffer.getManyPaginated({ limit: 50, autoPaginate: true, maxPages: 2 });

  const battleRankingPages = client.battleRanking.getRanking({
    dataType: "damage", type: "user", side: "merged", autoPaginate: true,
  });
  type BattleRankingPage = typeof battleRankingPages extends AsyncIterableIterator<infer Page> ? Page : never;
  type _battleRankingPageItem = Expect<Equal<BattleRankingPage["items"][number], BattleRankingItem>>;

  const voterPages = client.poll.getPollVoters({ pollId: "p", optionId: 0, autoPaginate: true });
  type VoterPage = typeof voterPages extends AsyncIterableIterator<infer Page> ? Page : never;
  type _voterPageItem = Expect<Equal<VoterPage["items"][number], PollVote>>;

  const auctionPages = client.mercenaryContractAuction.getActiveAuctions({ battleId: "b", autoPaginate: true, maxPages: 2 });
  type AuctionPage = typeof auctionPages extends AsyncIterableIterator<infer Page> ? Page : never;
  type _auctionPageItem = Expect<Equal<AuctionPage["items"][number], MercenaryContractAuctionListItem>>;

  // No-input procedures stay callable without an argument.
  void client.gameStat.getWorldDevelopment();
  void client.gameStat.getPpMoneyValue();
  void client.gameConfig.getMaxBountyRate();
  void client.region.getAll();
  void client.shop.getLastGifts();
  void client.employee.getMyEmployees();
  void client.employee.getMyWorkforceSummary();
  void client.employeeEvent.getMine();
  void client.employeeEvent.getPendingCount();
  void client.gameStat.getPpMoneyValueByItem();
  void client.managerOffer.getWageStats();
  void client.managerOffer.getManyPaginated();
  void client.gameStat.getBadgeStats();
  void client.gameStat.getMilestoneStats();
  void client.user.getTodayClaimCount();
  void client.upgrade.getMapUpgrades();
  void client.map.getMapData();
  void client.mercenaryContractAuction.getActiveAuctions();

  // Parameters the server ignores are not part of the input types.
  // @ts-expect-error page is not a server parameter
  void client.alliance.getManyPaginated({ page: 2 });
  // @ts-expect-error count is not a server parameter
  void client.company.getRecommendedRegionIdsByItemCode({ itemCode: "wood", count: 3 });
  // @ts-expect-error limit is not a server parameter
  void client.articleInteraction.getArticleTippers({ articleId: "a", limit: 2 });
  // @ts-expect-error status is not a getActiveAuctions filter
  void client.mercenaryContractAuction.getActiveAuctions({ status: "won" });
}

// Response shapes.
type _companyFreeMoves = Expect<Equal<CompanyGetByIdResponse["freeMoves"], number>>;
type _companyWorkerCountRemoved = Expect<Equal<"workerCount" extends keyof CompanyGetByIdResponse ? true : false, false>>;
type _activeBattle = Expect<Equal<Region["activeBattle"], RegionActiveBattle | undefined>>;
type _population = Expect<Equal<Region["currentPopulation"], number>>;
type _orderCountry = Expect<Equal<PublicTradingOrder["country"], string | undefined>>;
type _bookOrder = Expect<Equal<TradingOrderBook["sellOrders"][number], PublicTradingOrder>>;
type _tradingDay = Expect<Equal<ItemTradingGetItemTradingResponse["values"][number], ItemTradingValue>>;
type _workWage = Expect<Equal<WorkStatsItem["wage"], number | undefined>>;
type _wonBy = Expect<Equal<TournamentMatch["wonBy"], "attacker" | "defender" | undefined>>;
type _rosterRow = Expect<Equal<EmployeeGetCompanyRosterResponse["employees"][number], Employee>>;
type _employeeById = Expect<Equal<Awaited<ReturnType<APIClient["employee"]["getById"]>>, Employee | null>>;
type _historyRow = Expect<Equal<Awaited<ReturnType<APIClient["employeeEvent"]["getHistory"]>>[number], EmployeeEvent>>;
type _eventBand = Expect<Equal<EmployeeEventOutcome["band"], "crit" | "success" | "fail" | "critFail">>;
type _offerRow = Expect<Equal<ManagerOfferGetManyPaginatedResponse["items"][number], ManagerOffer>>;
type _manager = Expect<Equal<Awaited<ReturnType<APIClient["manager"]["getByCompanyId"]>>, Manager | null>>;
type _liteSkillsMoved = Expect<Equal<"skills" extends keyof UserGetUserLiteResponse ? true : false, false>>;
type _byIdSkills = Expect<Equal<UserGetUserByIdResponse["skills"], UserSkills>>;
type _userSkills = Expect<Equal<Awaited<ReturnType<APIClient["user"]["getUserSkills"]>>["skills"], UserSkills>>;
type _muById = Expect<Equal<Awaited<ReturnType<APIClient["mu"]["getById"]>>, MuListItem>>;
type _myVote = Expect<Equal<Awaited<ReturnType<APIClient["poll"]["getPoll"]>>["myVote"], number[] | null>>;
type _badgeRow = Expect<Equal<WarEraCustomEndpoints["gameStat.getBadgeStats"]["output"][string], GameStatHolderCount>>;
type _regionProperties = Expect<Equal<MapGetMapDataResponse["map"]["objects"]["regions"]["geometries"][number]["properties"], MapRegionProperties>>;
type _favoriteGovType = Expect<Equal<PartyGetByIdResponse["favoriteGovType"], string | null | undefined>>;

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
