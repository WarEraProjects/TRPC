/** A gifted skin: `key` names the skin, `slot` the equipment slot it is for (`sniper`, `tank`, `boots`, …). */
export type GiftedSkin = {
	key: string;
	slot: string;
};

/** One skin gift. `buyer` paid and `giftedTo` received it; both are user ids. */
export type SkinGift = {
	createdAt: string;
	buyer: string;
	giftedTo: string;
	skins: GiftedSkin[];
};

export type AssetSaleCustomEndpoints = {
	/** The latest skin gifts, newest first: three rows on 2026-11-10. Answers without an API key. */
	"assetSale.getLastSkinGifts": { output: SkinGift[] };
};
