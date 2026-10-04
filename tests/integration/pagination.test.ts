import { strict as assert } from "node:assert";
import { client, integrationTest } from "./helpers/context";

integrationTest("article pagination yields at most two valid pages", async () => {
  let count = 0;
  for await (const page of client.article.getArticlesPaginated({
    type: "last", limit: 5, maxPages: 2, autoPaginate: true,
  })) {
    assert.ok(Array.isArray(page.items));
    assert.ok(page.items.length <= 5);
    assert.equal(typeof page.cursor, "string");
    count++;
  }
  assert.ok(count > 0 && count <= 2);
});

integrationTest("article pagination accepts a date cutoff", async () => {
  let count = 0;
  for await (const page of client.article.getArticlesPaginated({
    type: "last", limit: 5, maxPages: 2, autoPaginate: true,
    cursorEnd: new Date(Date.now() - 24 * 60 * 60 * 1000),
  })) {
    assert.ok(Array.isArray(page.items));
    count++;
  }
  assert.ok(count > 0 && count <= 2);
});

integrationTest("article query returns a single page", async () => {
  const result = await client.article.getArticlesPaginated({ type: "last", limit: 3 });
  assert.ok(Array.isArray(result.items));
  assert.ok(result.items.length <= 3);
  assert.ok(result.nextCursor == null || typeof result.nextCursor === "string");
});

integrationTest("battle pagination yields at most three valid pages", async () => {
  let count = 0;
  for await (const page of client.battle.getBattles({
    autoPaginate: true, maxPages: 3, limit: 5,
  })) {
    assert.ok(Array.isArray(page.items));
    assert.ok(page.items.length <= 5);
    count++;
  }
  assert.ok(count > 0 && count <= 3);
});
