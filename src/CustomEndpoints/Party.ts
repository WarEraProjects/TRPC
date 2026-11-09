export type PartyGetByIdInput = {
	partyId: string;
};

export type PartyGetByIdResponse = {
	_id: string;
	name: string;
	description?: string;
	country: string;
	region: string;
	/** Absent while a party has no leader. */
	leader?: string;
	councilMembers: string[];
	members: string[];
	createdAt: string;
	updatedAt: string;
	__v: number;
	avatarUrl?: string;
	treasurer?: string;
	primaryWinner?: string;
	/** User ids; absent on parties that never set a list, and possibly empty. */
	congressList?: string[];
	congressListUpdatedAt?: string;
	/** A user id. */
	congressListUpdatedBy?: string;
	/** A government type such as `federation` or `autocracy`, or `null`. */
	favoriteGovType?: string | null;
};

export type PartyGetInactiveMemberIdsInput = {
	partyId: string;
};

export type PartyGetManyPaginatedInput = {
	countryId?: string;
	limit?: number;
	cursor?: string;
	direction?: "forward" | "backward";
};

export type PartyGetManyPaginatedResponse = {
	items: PartyGetByIdResponse[];
	nextCursor?: string;
};

export type PartyCustomEndpoints = {
	"party.getById": {
		input: PartyGetByIdInput;
		output: PartyGetByIdResponse;
	};
	"party.getManyPaginated": {
		input: PartyGetManyPaginatedInput;
		output: PartyGetManyPaginatedResponse;
	};
	/**
	 * Ids from `members` whose profile has `isActive: false`; usually an empty list. Answers
	 * without an API key.
	 */
	"party.getInactiveMemberIds": {
		input: PartyGetInactiveMemberIdsInput;
		output: string[];
	};
};
