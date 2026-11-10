import { integrationTest, assert, client } from "./helpers/context";

const procedures = ["getArticleLikers", "getArticleDislikers", "getArticleTippers", "getArticleGemTippers"] as const;

let cachedArticleId: Promise<string> | undefined;
/** The most liked of the latest articles, so that at least the likers list is likely to have rows. */
function getArticleId() {
  return cachedArticleId ??= (async () => {
    const { items } = await client.article.getArticlesPaginated({ type: "last", limit: 20 });
    const [article] = [...items].sort((a, b) => b.stats.likes - a.stats.likes);
    assert(article, "expected at least one article");
    return article._id;
  })();
}

for (const name of procedures) {
  integrationTest(`articleInteraction.${name}`, async () => {
    const value = await client.articleInteraction[name]({ articleId: await getArticleId() });

    assert(Array.isArray(value), "expected an array");
    for (const [index, row] of value.entries()) {
      assert(typeof row.userId === "string" && typeof row.createdAt === "string", "expected userId and createdAt");
      if (index > 0) assert(value[index - 1].createdAt >= row.createdAt, "expected the newest first");
    }
  });
}
