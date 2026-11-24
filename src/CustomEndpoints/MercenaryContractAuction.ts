import type { MercenaryContractAuctionGetPaginatedAuctionsResponse } from "../api/Responses";

export type MercenaryContractAuctionGetActiveAuctionsInput = {
	/** The server returns 20 without it. */
	limit?: number;
	cursor?: string;
	/**
	 * Matches the auction's `country`. In every auction checked on 2026-11-09 `country` equaled
	 * `forCountry`, so which of the two the server filters on is unverified.
	 */
	countryId?: string;
	battleId?: string;
};

export type MercenaryContractAuctionGetBidEligibilityInput = {
	muId: string;
	/** Up to 50 auction ids. */
	auctionIds: string[];
};

export type MercenaryContractAuctionBidEligibility = {
	/** Why the MU cannot bid, such as `"ally"` or `"pact"` on 2026-11-24; `null` when it can. */
	blockedReason: string | null;
};

export type MercenaryContractAuctionCustomEndpoints = {
	/**
	 * Open auctions only, newest first. Unlike `getPaginatedAuctions` it has no `status` filter;
	 * the server ignores one. Answers without an API key.
	 */
	"mercenaryContractAuction.getActiveAuctions": {
		input: MercenaryContractAuctionGetActiveAuctionsInput;
		output: MercenaryContractAuctionGetPaginatedAuctionsResponse;
	};
	/**
	 * Whether the MU may bid on each auction, keyed by auction id. An unknown auction id is left
	 * out; an unknown MU fails with `NOT_FOUND`. Answers without an API key.
	 */
	"mercenaryContractAuction.getBidEligibility": {
		input: MercenaryContractAuctionGetBidEligibilityInput;
		output: Record<string, MercenaryContractAuctionBidEligibility>;
	};
};
