import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  APIClient,
  BattleRankingItem,
  CompanyGetByIdResponse,
  CongressSeat,
  CustomEndpointDefinition,
  Employee,
  EmployeeEvent,
  EmployeeEventOutcome,
  EmployeeGetCompanyRosterResponse,
  EmployeeWork,
  EmployeeWorkStatsItem,
  GameConfigBadges,
  GameStatHolderCount,
  GovernmentMinister,
  InputFor,
  ItemTradingGetItemTradingResponse,
  ItemTradingValue,
  LeagueGetUserLeagueResponse,
  LeagueReward,
  Manager,
  ManagerOffer,
  ManagerOfferGetManyPaginatedResponse,
  MapGetMapDataResponse,
  MapRegionProperties,
  MercenaryContractAuctionBidEligibility,
  MercenaryContractAuctionListItem,
  MuLeagueGetMuLeagueResponse,
  MuLeagueMove,
  MuListItem,
  MuSponsorship,
  PartyGetByIdResponse,
  PinnedArticle,
  PollVote,
  PrivateMercenaryDamage,
  PublicTradingOrder,
  RankingDetails,
  RankingGetRankingPageResponse,
  RankingGetRankingResponse,
  RankingItem,
  RankingSnapshotRecentRanks,
  RankingType,
  Region,
  RegionActiveBattle,
  SkinGift,
  StateArmyExpenseEntry,
  StrategicResourceBonuses,
  SubGiftDropEntrant,
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
  // @ts-expect-error allianceId is required
  void client.alliance.getStrategicResourceBonuses();
  // @ts-expect-error countryId is required
  void client.country.getStrategicResourceBonuses({});
  // @ts-expect-error countryId is required
  void client.government.getCongressSeats();

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

  // @ts-expect-error entityId is required
  void client.ranking.getRankingAround({ rankingType: "userDamages" });
  void client.ranking.getRankingAround({ rankingType: "userDamages", entityId: "u", countryId: "c" });
  void client.ranking.getRankingPage({ rankingType: "userMercenaryEarnings", muId: "m", limit: 50 });
  // @ts-expect-error rankingType is required
  void client.ranking.getRankingPage({ limit: 50 });

  // The two work procedures a keyed probe found on 2026-11-24.
  // @ts-expect-error employeeId is required
  void client.work.getLastByEmployee({ limit: 5 });
  void client.work.getLastByEmployee({ employeeId: "e", limit: 5 });
  // @ts-expect-error employeeId is required
  void client.work.getStatsByEmployee({ days: 30 });
  void client.work.getStatsByEmployee({ employeeId: "e", days: 30 });
  void client.ranking.getRanking({ rankingType: "userWelcomeGifts" });

  // The procedures found on 2026-11-24.
  // @ts-expect-error battleId is required
  void client.battleRanking.getPrivateMercenaryDamage({ roundId: "r" });
  void client.battleRanking.getPrivateMercenaryDamage({ battleId: "b", roundId: "r" });
  // @ts-expect-error userId is required
  void client.league.getUserLeague();
  // @ts-expect-error auctionIds is required
  void client.mercenaryContractAuction.getBidEligibility({ muId: "m" });
  // @ts-expect-error muId is required
  void client.muLeague.getMuLeague({});
  // @ts-expect-error countryId is required
  void client.muSponsorship.getByCountry({});
  // @ts-expect-error muId is required
  void client.muSponsorship.getForMu();
  // @ts-expect-error range is required
  void client.rankingSnapshot.getHistory({ entityId: "e", rankingType: "userDamages" });
  // @ts-expect-error range is 7d, 30d, 90d or 1y
  void client.rankingSnapshot.getHistory({ entityId: "e", rankingType: "userDamages", range: "14d" });
  // @ts-expect-error rankingType takes the ranking names
  void client.rankingSnapshot.getPreviousRanks({ rankingType: "damages", entityIds: ["e"] });
  // @ts-expect-error unknown expense kinds are rejected by the server
  void client.stateArmyExpense.getLedger({ countryId: "c", kind: "wage" });
  // @ts-expect-error dropId is required
  void client.subGiftDrop.getView({});
  void client.muLeague.getDivisionCounts();
  void client.muSponsorship.getSponsorable({ countryId: "c" });
  void client.stateArmyExpense.getOverview({ countryId: "c" });

  const ledgerPages = client.stateArmyExpense.getLedger({ countryId: "c", kind: "hqOil", autoPaginate: true });
  type LedgerPage = typeof ledgerPages extends AsyncIterableIterator<infer Page> ? Page : never;
  type _ledgerPageItem = Expect<Equal<LedgerPage["items"][number], StateArmyExpenseEntry>>;
  const sponsorshipPages = client.muSponsorship.getActiveByCountryPaginated({ countryId: "c", autoPaginate: true });
  type SponsorshipPage = typeof sponsorshipPages extends AsyncIterableIterator<infer Page> ? Page : never;
  type _sponsorshipPageItem = Expect<Equal<SponsorshipPage["items"][number], MuSponsorship>>;
  const entrantPages = client.subGiftDrop.getEntrants({ dropId: "d", limit: 100, autoPaginate: true });
  type EntrantPage = typeof entrantPages extends AsyncIterableIterator<infer Page> ? Page : never;
  type _entrantPageItem = Expect<Equal<EntrantPage["items"][number], SubGiftDropEntrant>>;

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

  const rankingPages = client.ranking.getRankingPage({ rankingType: "countryDamages", autoPaginate: true, maxPages: 2 });
  type RankingPage = typeof rankingPages extends AsyncIterableIterator<infer Page> ? Page : never;
  type _rankingPageItem = Expect<Equal<RankingPage["items"][number], RankingItem>>;

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
  void client.article.getPinnedArticles();
  void client.assetSale.getLastSkinGifts();

  // Parameters the server ignores are not part of the input types.
  // Definitions built with the exported helper keep their input.
  const extended = client._ce<{
    "custom.withInput": CustomEndpointDefinition<{ id: string }, number>;
    "custom.withoutInput": CustomEndpointDefinition<never, string>;
  }>();
  void extended.custom.withInput({ id: "x" });
  // @ts-expect-error id is required
  void extended.custom.withInput();
  void extended.custom.withoutInput();
  type _helperOutput = Expect<Equal<Awaited<ReturnType<typeof extended.custom.withInput>>, number>>;

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
type _employeeShifts = Expect<Equal<Awaited<ReturnType<APIClient["work"]["getLastByEmployee"]>>, EmployeeWork[]>>;
type _employeeDays = Expect<Equal<Awaited<ReturnType<APIClient["work"]["getStatsByEmployee"]>>, EmployeeWorkStatsItem[]>>;
type _shiftTool = Expect<Equal<NonNullable<EmployeeWork["tool"]>["skills"], { production: number }>>;
type _wonBy = Expect<Equal<TournamentMatch["wonBy"], "attacker" | "defender" | undefined>>;
type _matchBattle = Expect<Equal<TournamentMatch["battle"], string | undefined>>;
type _welcomeGifts = Expect<Equal<"userWelcomeGifts" extends RankingType ? true : false, true>>;
type _ministers = Expect<Equal<Awaited<ReturnType<APIClient["government"]["getByCountryId"]>>["ministers"], GovernmentMinister[] | undefined>>;
type _privateMercenaryMoney = Expect<Equal<PrivateMercenaryDamage["money"], { attacker: number; defender: number }>>;
type _muLeagueBadge = Expect<Equal<GameConfigBadges["muLeagueWinner"]["uniqueMetadataKey"], string>>;
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
// A procedure without input returns a promise, not the auto-pagination iterator.
type _noInputCustom = Expect<Equal<ReturnType<APIClient["gameStat"]["getWorldDevelopment"]>, Promise<number>>>;
type _noInputRegions = Expect<Equal<ReturnType<APIClient["region"]["getAll"]>, Promise<Region[]>>>;
// The OpenAPI file types a missing input as Record<string, never>, not never.
type _noInputOpenApi = Expect<Equal<ReturnType<APIClient["country"]["getAllCountries"]> extends Promise<unknown> ? true : false, true>>;
type _noInputFor = Expect<Equal<InputFor<"country.getAllCountries">, Record<string, never>>>;
type _pinned = Expect<Equal<Awaited<ReturnType<APIClient["article"]["getPinnedArticles"]>>, PinnedArticle[]>>;
type _pinnedUntil = Expect<Equal<PinnedArticle["pinnedUntil"], string>>;
type _skinGifts = Expect<Equal<Awaited<ReturnType<APIClient["assetSale"]["getLastSkinGifts"]>>, SkinGift[]>>;
type _countryBonuses = Expect<Equal<Awaited<ReturnType<APIClient["country"]["getStrategicResourceBonuses"]>>, StrategicResourceBonuses | null>>;
type _allianceBonusesId = Expect<Equal<NonNullable<Awaited<ReturnType<APIClient["alliance"]["getStrategicResourceBonuses"]>>>["allianceId"], string>>;
type _seats = Expect<Equal<Awaited<ReturnType<APIClient["government"]["getCongressSeats"]>>, CongressSeat[]>>;
type _seatParty = Expect<Equal<CongressSeat["party"], string | undefined>>;
type _rankingCount = Expect<Equal<RankingGetRankingResponse["count"], number>>;
type _rankingZeroRank = Expect<Equal<RankingGetRankingResponse["zeroRank"], number | undefined>>;
type _rankingIsGlobalRemoved = Expect<Equal<"isGlobal" extends keyof RankingGetRankingResponse ? true : false, false>>;
type _rankingItemType = Expect<Equal<RankingItem["type"], RankingType>>;
type _rankingDetailsType = Expect<Equal<RankingDetails["type"], RankingType>>;
type _rankingFirstPage = Expect<Equal<RankingGetRankingPageResponse["ranking"], RankingDetails | undefined>>;
type _rankingAround = Expect<Equal<Awaited<ReturnType<APIClient["ranking"]["getRankingAround"]>>, RankingItem[]>>;
type _rankingType = Expect<Equal<RankingType, InputFor<"ranking.getRanking">["rankingType"]>>;
type _recentRanks = Expect<Equal<RankingSnapshotRecentRanks["ranks"]["userDamages"], (number | null)[] | undefined>>;
type _previousRanks = Expect<Equal<Awaited<ReturnType<APIClient["rankingSnapshot"]["getPreviousRanks"]>>, Record<string, number>>>;
type _sponsorshipForMu = Expect<Equal<Awaited<ReturnType<APIClient["muSponsorship"]["getForMu"]>>, MuSponsorship | null>>;
type _bidEligibility = Expect<Equal<Awaited<ReturnType<APIClient["mercenaryContractAuction"]["getBidEligibility"]>>, Record<string, MercenaryContractAuctionBidEligibility>>>;
type _leaguePlace = Expect<Equal<LeagueGetUserLeagueResponse["placeRewards"][number], LeagueReward | null>>;
type _muLeagueMove = Expect<Equal<MuLeagueGetMuLeagueResponse["rows"][number]["move"], MuLeagueMove>>;
type _muLeagueDivisions = Expect<Equal<Awaited<ReturnType<APIClient["muLeague"]["getDivisionCounts"]>>["mus"], number[]>>;

/** The id a ranking entry is about: a user in player rankings, else the country, MU or alliance. */
function rankedEntity(entry: RankingItem): string | undefined {
  return entry.user ?? entry.mu ?? entry.country ?? entry.alliance;
}

test("custom endpoint type contracts compile", () => {
  assert.equal(rankedEntity({ _id: "r", type: "userDamages", user: "u", country: "c", mu: "m", value: 2, rank: 1, tier: "master" }), "u");
  assert.equal(rankedEntity({ _id: "r", type: "allianceDamages", alliance: "a", value: 1, rank: 1, tier: "bronze" }), "a");
});
