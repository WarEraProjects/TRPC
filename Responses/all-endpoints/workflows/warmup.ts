import { operationOrder } from "../config";
import type { EndpointRunner } from "../runner";

export async function runWarmup(runner: EndpointRunner): Promise<void> {
  for (const op of operationOrder) {
    if (runner.getResponse(op)) {
      continue;
    }

    if (op === "search.searchAnything") {
      await runner.loadOrFetchByOperation(op, {
        searchText: process.env.WARERA_SEARCH_TEXT ?? "war",
      });
      continue;
    }

    if (op === "ranking.getRanking") {
      await runner.loadOrFetchByOperation(op, { rankingType: "countryDamages" });
      continue;
    }

    if (op === "article.getArticlesPaginated") {
      await runner.loadOrFetchByOperation(op, {
        type: "last",
        limit: runner.sampleSize,
      });
      continue;
    }

    if (
      op === "event.getEventsPaginated" ||
      op === "battle.getBattles" ||
      op === "mu.getManyPaginated" ||
      op === "transaction.getPaginatedTransactions"
    ) {
      await runner.loadOrFetchByOperation(op, { limit: runner.sampleSize });
      continue;
    }

    await runner.loadOrFetchByOperation(op, {});
  }
}
