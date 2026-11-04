import type { EndpointRunner } from "../runner";
import type { CollectedIds } from "../types";

export async function runOffersAndMuWorkflow(
  runner: EndpointRunner,
  ids: CollectedIds
): Promise<void> {
  const trpc = runner.client;

  const prices =
    runner.getResponse("itemTrading.getPrices") ??
    (await runner.loadOrFetch("itemTrading.getPrices", () => trpc.itemTrading.getPrices({})));

  const itemCode = runner.resolveId(prices, ["itemCode", "code"], "WARERA_ITEM_CODE");
  ids.itemCode = itemCode;

  if (itemCode) {
    await runner.loadOrFetch("tradingOrder.getTopOrders", () =>
      trpc.tradingOrder.getTopOrders({
        itemCode,
        limit: runner.sampleSize,
      })
    );
  }

  const mus =
    runner.getResponse("mu.getManyPaginated") ??
    (await runner.loadOrFetch("mu.getManyPaginated", () =>
      trpc.mu.getManyPaginated({ limit: runner.sampleSize })
    ));

  const muId = runner.resolveId(mus, ["muId", "_id", "id"], "WARERA_MU_ID");
  ids.muId = muId;

  if (muId) {
    await runner.loadOrFetch("mu.getById", () => trpc.mu.getById({ muId }));
  }

  await runner.loadOrFetch("upgrade.getUpgradeByTypeAndEntity", () =>
    trpc.upgrade.getUpgradeByTypeAndEntity({
      upgradeType: "bunker",
      regionId: ids.regionId,
      companyId: ids.companyId,
      muId,
    })
  );

  await runner.loadOrFetch("search.searchAnything", () =>
    trpc.search.searchAnything({
      searchText: process.env.WARERA_SEARCH_TEXT ?? "war",
    })
  );
}
