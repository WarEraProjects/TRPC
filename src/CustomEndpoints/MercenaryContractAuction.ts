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

export type MercenaryContractAuctionCustomEndpoints = {
	/**
	 * Open auctions only, newest first. Unlike `getPaginatedAuctions` it has no `status` filter;
	 * the server ignores one. Answers without an API key.
	 */
	"mercenaryContractAuction.getActiveAuctions": {
		input: MercenaryContractAuctionGetActiveAuctionsInput;
		output: MercenaryContractAuctionGetPaginatedAuctionsResponse;
	};
};
