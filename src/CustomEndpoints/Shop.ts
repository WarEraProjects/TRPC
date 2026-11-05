export type ShopGift = { _id: string; giftedBy: string; recipient: string; createdAt: string };
export type ShopSubscribedUser = { _id: string; subscriptionDate: string };
export type ShopGiftGiver = {
	_id: string;
	giftCount: number;
	/** Absent from all 10 rows checked on 2026-11-04. */
	username?: string;
};
export type ShopCustomEndpoints = {
	"shop.getLastGifts": { output: ShopGift[] };
	"shop.getSubscribedUsers": { output: ShopSubscribedUser[] };
	"shop.getTopGiftGivers": { output: ShopGiftGiver[] };
};
