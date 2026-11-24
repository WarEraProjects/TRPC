import { integrationTest, assert, client } from "./helpers/context";

/** A drop announced in one of the last 200 articles, which carry its id as `data-giveaway-id`. */
async function findDropId(): Promise<string | undefined> {
  for await (const page of client.article.getArticlesPaginated({ type: "last", limit: 50, autoPaginate: true, maxPages: 4 })) {
    for (const article of page.items) {
      const match = /data-giveaway-id=\\?"([0-9a-f]{24})/.exec(String(article.content));
      if (match) return match[1];
    }
  }
  return undefined;
}

integrationTest("subGiftDrop.getView and getEntrants", async () => {
  const dropId = await findDropId();
  if (!dropId) {
    // No drop in the recent articles: only the unknown-id answer can be checked.
    let error: any;
    try {
      await client.subGiftDrop.getView({ dropId: "000000000000000000000000" });
    } catch (caught) {
      error = caught;
    }
    assert(error?.data?.code === "NOT_FOUND", "expected NOT_FOUND for an unknown drop");
    return;
  }

  const view = await client.subGiftDrop.getView({ dropId });
  assert(view.dropId === dropId && typeof view.articleId === "string", "expected the drop and its article");
  assert(Number.isInteger(view.count) && typeof view.gems === "number", "expected count and gems");
  assert(Array.isArray(view.recentEntrantIds) && Array.isArray(view.winnerUserIds), "expected the entrant and winner lists");
  assert(view.isDrawn || view.winnerUserIds.length === 0, "expected no winners before the draw");

  const entrants = await client.subGiftDrop.getEntrants({ dropId, limit: 5 });
  assert(entrants.items.length <= 5, "expected at most 5 entrants");
  for (const [index, entrant] of entrants.items.entries()) {
    assert(typeof entrant.user === "string" && typeof entrant.createdAt === "string", "expected user and createdAt");
    if (index > 0) assert(entrants.items[index - 1].createdAt >= entrant.createdAt, "expected the newest first");
  }
});
