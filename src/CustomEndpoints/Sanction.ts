/** Moderation action types observed by paginating `sanction.getPaginated`. */
export type SanctionType =
	| "BAN"
	| "UNBAN"
	| "MUTE_USER"
	| "UNMUTE_USER"
	| "WARN_USER"
	| "FINE_USER"
	| "GIVE_MONEY_TO_USER"
	| "GIVE_BADGE"
	| "DELETE_MESSAGE"
	| "DELETE_ARTICLE"
	| "CHANGE_ARTICLE_CATEGORY"
	| "RESET_USERNAME"
	| "REMOVE_AVATAR"
	| "REMOVE_DESCRIPTION"
	| "ADD_TO_FAMILY_GROUP"
	| "REMOVE_FROM_FAMILY_GROUP"
	| "REMOVE_ALL_USER_OFFERS"
	| "CANCEL_TRADING_ORDER"
	| "DESTROY_ITEM"
	| "DELETE_ASSET_PROPOSITION"
	| "ACCEPT_BANNER";

export type SanctionGetPaginatedInput = {
	targetUserId?: string;
	type?: SanctionType | (string & {});
	/** Between 1 and 100. */
	limit?: number;
	cursor?: string;
};

export type SanctionDestroyedItem = {
	_id: string;
	code: string;
	skills: Record<string, number>;
	state: number;
	maxState: number;
	quantity: number;
	lastAcquisitionAt: string;
	type?: string;
	isEquipStatsMigrated?: boolean;
};

/**
 * Discriminated on `type`. Variants and fields were observed by paginating
 * `sanction.getPaginated`; an action type that is not listed falls outside the union.
 */
export type SanctionData =
	| {
		type: "BAN";
		reason: string;
		banDurationInDays: number;
		unbannedAt: string;
		removeDamages?: boolean;
		moneyPenalty?: number;
	}
	| { type: "UNBAN"; reason: string }
	| {
		type: "MUTE_USER";
		reason: string;
		unMuteAt: string;
		durationInHours?: number;
		durationInDays?: number;
	}
	| { type: "UNMUTE_USER"; reason: string }
	| { type: "WARN_USER"; message: string }
	| { type: "FINE_USER"; amount: number; reason: string }
	| { type: "GIVE_MONEY_TO_USER"; amount: number; reason: string }
	| { type: "GIVE_BADGE"; badgeType: string }
	| { type: "DELETE_MESSAGE"; messageId?: string }
	| { type: "DELETE_ARTICLE" }
	| {
		type: "CHANGE_ARTICLE_CATEGORY";
		articleId: string;
		articleTitle: string;
		oldCategory: string;
		newCategory: string;
	}
	| { type: "RESET_USERNAME"; oldUsername: string; newUsername: string }
	| { type: "REMOVE_AVATAR" }
	| { type: "REMOVE_DESCRIPTION" }
	| { type: "ADD_TO_FAMILY_GROUP"; targetUsername: string }
	| { type: "REMOVE_FROM_FAMILY_GROUP" }
	| {
		type: "REMOVE_ALL_USER_OFFERS";
		itemOffersCount: number;
		tradingOrdersCount: number;
		workOffersCount: number;
		reason: string;
	}
	| {
		type: "CANCEL_TRADING_ORDER";
		orderId: string;
		orderType: "buy" | "sell";
		itemCode: string;
		quantity: number;
		price: number;
		ownerUserId: string;
		ownerCountryId?: string;
		ownerMuId?: string;
		ownerPartyId?: string;
	}
	| { type: "DESTROY_ITEM"; item: SanctionDestroyedItem }
	| {
		type: "DELETE_ASSET_PROPOSITION";
		propositionId: string;
		propositionName: string;
		propositionType: string;
		propositionStatus: string;
		imageUrl?: string;
		videoUrl?: string;
	}
	| {
		type: "ACCEPT_BANNER";
		bannerId: string;
		bannerTitle: string;
		propositionId: string;
		propositionName: string;
		authorId: string;
		price: number;
	};

export type Sanction = {
	_id: string;
	targetUser: string;
	data: SanctionData;
	createdAt: string;
	updatedAt: string;
	__v: number;
};

export type SanctionGetPaginatedResponse = { items: Sanction[]; nextCursor?: string | null };

export type SanctionCustomEndpoints = {
	"sanction.getPaginated": { input: SanctionGetPaginatedInput; output: SanctionGetPaginatedResponse };
};
