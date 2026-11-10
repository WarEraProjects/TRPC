import { integrationTest, assert, client } from "./helpers/context";

integrationTest("assetSale.getLastSkinGifts", async () => {
  const value = await client.assetSale.getLastSkinGifts();

  assert(Array.isArray(value), "expected an array");
  for (const gift of value) {
    assert(typeof gift.buyer === "string" && typeof gift.giftedTo === "string", "expected buyer and giftedTo ids");
    assert(typeof gift.createdAt === "string", "expected createdAt");
    assert(gift.skins.every((skin) => typeof skin.key === "string" && typeof skin.slot === "string"), "expected skins with key and slot");
  }
});
