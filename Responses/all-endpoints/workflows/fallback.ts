import { allOperations } from "../config";
import type { EndpointRunner } from "../runner";
import type { CollectedIds, OperationKey } from "../types";

const TRANSACTION_TYPES = [
  "applicationFee",
  "trading",
  "itemMarket",
  "wage",
  "donation",
  "articleTip",
  "openCase",
  "craftItem",
  "dismantleItem",
] as const;

export async function runFallbackWorkflow(
  runner: EndpointRunner,
  ids: CollectedIds
): Promise<void> {
  const finalRegionId = ids.regionId ?? process.env.WARERA_REGION_ID;
  const finalCompanyId = ids.companyId ?? process.env.WARERA_COMPANY_ID;
  const finalMuId = ids.muId ?? process.env.WARERA_MU_ID;
  const finalBattleId = ids.battleId ?? process.env.WARERA_BATTLE_ID;
  const finalBattleLootBattleId =
    process.env.WARERA_BATTLE_LOOT_BATTLE_ID ?? finalBattleId;
  const finalBattleLootUserId =
    process.env.WARERA_BATTLE_LOOT_USER_ID ?? ids.userId;
  const finalRoundId =
    (process.env.WARERA_ROUND_ID as string | undefined) ??
    ids.roundId ??
    runner.resolveId(
      runner.getResponse("battle.getLiveBattleData"),
      ["roundId", "_id", "id"],
      "WARERA_ROUND_ID"
    );
  const finalWorkOfferId = ids.workOfferId ?? process.env.WARERA_WORK_OFFER_ID;
  const finalArticleId = ids.articleId ?? process.env.WARERA_ARTICLE_ID;
  const finalItemCode = runner.finalItemCodeFromEnvOrCache(
    ids.itemCode,
    process.env.WARERA_ITEM_CODE
  );
  const finalItemOfferId = process.env.WARERA_ITEM_OFFER_ID;
  const finalCompanyIdResolved = finalCompanyId ?? runner.resolveCompanyIdFromCache();

  const getInputForOperation = (
    op: OperationKey
  ): Record<string, unknown> | undefined => {
    switch (op) {
      case "company.getById":
        if (!finalCompanyIdResolved) {
          return undefined;
        }
        return { companyId: finalCompanyIdResolved };
      case "company.getCompanies":
        return {};
      case "country.getCountryById":
        return { countryId: ids.countryId };
      case "country.getAllCountries":
        return {};
      case "event.getEventsPaginated":
        return { limit: runner.sampleSize };
      case "government.getByCountryId":
        return { countryId: ids.countryId };
      case "region.getById":
        return {
          regionId: runner.requireId("regionId", finalRegionId, "WARERA_REGION_ID"),
        };
      case "region.getRegionsObject":
        return {};
      case "battle.getById":
      case "battle.getLiveBattleData":
        return {
          battleId: runner.requireId("battleId", finalBattleId, "WARERA_BATTLE_ID"),
        };
      case "battle.getBattles":
        return { limit: runner.sampleSize };
      case "round.getById":
      case "round.getLastHits":
        return {
          roundId: runner.requireId("roundId", finalRoundId, "WARERA_ROUND_ID"),
        };
      case "battleRanking.getRanking":
        return {
          battleId: finalBattleId,
          roundId: finalRoundId,
          dataType: "damage",
          type: "country",
          side: "attacker",
        };
      case "itemTrading.getPrices":
        return {};
      case "tradingOrder.getTopOrders":
        return { itemCode: finalItemCode, limit: runner.sampleSize };
      case "itemOffer.getById":
        if (!finalItemOfferId) {
          return undefined;
        }
        return { itemOfferId: finalItemOfferId };
      case "workOffer.getById":
        return {
          workOfferId: runner.requireId(
            "workOfferId",
            finalWorkOfferId,
            "WARERA_WORK_OFFER_ID"
          ),
        };
      case "workOffer.getWorkOfferByCompanyId": {
        const cid = ids.companyFromWorkOffers ?? finalCompanyIdResolved;
        if (!cid) {
          return undefined;
        }
        return { companyId: cid };
      }
      case "workOffer.getWorkOffersPaginated":
        return { limit: runner.sampleSize };
      case "ranking.getRanking":
        return { rankingType: "countryDamages" };
      case "search.searchAnything":
        return { searchText: process.env.WARERA_SEARCH_TEXT ?? "a" };
      case "gameConfig.getDates":
      case "gameConfig.getGameConfig":
        return {};
      case "user.getUserLite":
      case "user.getUserById":
        return { userId: ids.userId };
      case "user.getUsersByCountry":
        return { countryId: ids.countryId, limit: runner.sampleSize };
      case "article.getArticleById":
      case "article.getArticleLiteById":
        return {
          articleId: runner.requireId(
            "articleId",
            finalArticleId,
            "WARERA_ARTICLE_ID"
          ),
        };
      case "article.getArticlesPaginated":
        return { type: "last", limit: runner.sampleSize };
      case "mu.getById":
        return { muId: runner.requireId("muId", finalMuId, "WARERA_MU_ID") };
      case "mu.getManyPaginated":
      case "transaction.getPaginatedTransactions":
        return { limit: runner.sampleSize };
      case "upgrade.getUpgradeByTypeAndEntity":
        return {
          upgradeType: "bunker",
          regionId: finalRegionId,
          companyId: finalCompanyIdResolved,
          muId: finalMuId,
        };
      case "worker.getWorkers":
        return finalCompanyIdResolved
          ? { companyId: finalCompanyIdResolved }
          : { userId: runner.requireId("userId", ids.userId, "WARERA_USER_ID") };
      case "worker.getTotalWorkersCount":
        return { userId: ids.userId };
      case "battleOrder.getByBattle":
        return {
          battleId: runner.requireId("battleId", finalBattleId, "WARERA_BATTLE_ID"),
          side: "attacker",
        };
      case "battleLootSummary.getByBattleAndUser":
        return {
          battleId: runner.requireId(
            "battleLootBattleId",
            finalBattleLootBattleId,
            "WARERA_BATTLE_LOOT_BATTLE_ID"
          ),
          userId: runner.requireId(
            "battleLootUserId",
            finalBattleLootUserId,
            "WARERA_BATTLE_LOOT_USER_ID"
          ),
        };
      case "inventory.fetchCurrentEquipment":
        return { userId: runner.requireId("userId", ids.userId, "WARERA_USER_ID") };
      case "mercenaryContractAuction.getPaginatedAuctions":
        return { limit: runner.sampleSize };
      default:
        return {};
    }
  };

  for (const op of allOperations) {
    if (op === "transaction.getPaginatedTransactions") {
      await runner.loadOrFetch(
        "transaction.getPaginatedTransactions",
        async () => {
          const pages = await Promise.all([
            runner.client.transaction.getPaginatedTransactions({ limit: runner.sampleSize }),
            ...TRANSACTION_TYPES.map((transactionType) =>
              runner.client.transaction.getPaginatedTransactions({
                limit: runner.sampleSize,
                transactionType,
              })
            ),
          ]);

          return mergeTransactionPages(pages);
        },
        true
      );
      continue;
    }

    const input = getInputForOperation(op);
    if (!input) {
      continue;
    }
    await runner.loadOrFetchByOperation(op, input);
  }
}

function mergeTransactionPages(
  pages: Array<{ items?: unknown[]; nextCursor?: string } | undefined>
): { items: unknown[]; nextCursor: null } {
  const seen = new Set<string>();
  const items: unknown[] = [];

  for (const page of pages) {
    if (!page || !Array.isArray(page.items)) {
      continue;
    }

    for (const item of page.items) {
      const key = toTransactionItemKey(item);
      if (key && seen.has(key)) {
        continue;
      }
      if (key) {
        seen.add(key);
      }
      items.push(item);
    }
  }

  return { items, nextCursor: null };
}

function toTransactionItemKey(item: unknown): string | undefined {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return undefined;
  }

  const record = item as Record<string, unknown>;
  const id = record._id;
  if (typeof id === "string" && id.length > 0) {
    return id;
  }

  const buyerId = record.buyerId;
  const sellerId = record.sellerId;
  const itemCode = record.itemCode;
  const createdAt = record.createdAt;
  const transactionType = record.transactionType;
  const parts = [buyerId, sellerId, itemCode, createdAt, transactionType].filter(
    (value): value is string => typeof value === "string" && value.length > 0
  );

  if (parts.length === 0) {
    return undefined;
  }

  return parts.join("|");
}
