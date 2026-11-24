export type SubGiftDropGetViewInput = {
	/** Articles that announce a drop carry its id as `data-giveaway-id` in their content. */
	dropId: string;
};

export type SubGiftDropGetEntrantsInput = {
	dropId: string;
	/** From 1 to 100. */
	limit?: number;
	cursor?: string;
};

/** A giveaway of gems or supporter plans that players join from an article. */
export type SubGiftDropView = {
	dropId: string;
	dropperUserId: string;
	articleId: string;
	/** `"gems"` or `"supporterPlan"` on 2026-11-24. */
	prize: string;
	/** Number of winners. */
	count: number;
	/** The gem value of the whole drop. */
	gems: number;
	/** Set on `gems` drops. */
	gemsPerWinner?: number;
	message?: string;
	durationHours: number;
	isDraft: boolean;
	endsAt: string;
	entrantsCount: number;
	/** User ids of the last 8 entrants, oldest first. */
	recentEntrantIds: string[];
	isDrawn: boolean;
	/** Empty until the drop is drawn. */
	winnerUserIds: string[];
	/** Set once the drop is drawn. */
	refundedGems?: number;
	/** Whether the caller joined. `false` in every view read without credentials on 2026-11-24. */
	hasJoined: boolean;
};

export type SubGiftDropEntrant = {
	_id: string;
	user: string;
	createdAt: string;
};

export type SubGiftDropGetEntrantsResponse = {
	items: SubGiftDropEntrant[];
	nextCursor?: string;
};

export type SubGiftDropCustomEndpoints = {
	/** An unknown id fails with `NOT_FOUND` ("Giveaway not found."). Answers without an API key. */
	"subGiftDrop.getView": {
		input: SubGiftDropGetViewInput;
		output: SubGiftDropView;
	};
	/** Entrants, newest first. Answers without an API key. */
	"subGiftDrop.getEntrants": {
		input: SubGiftDropGetEntrantsInput;
		output: SubGiftDropGetEntrantsResponse;
	};
};
