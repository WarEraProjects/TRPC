export type PartyGetByIdInput = {
	partyId: string;
};

export interface PartyEthics {
	militarism: number;
	isolationism: number;
	imperialism: number;
	industrialism: number;
	unethical: boolean;
}

export type PartyGetByIdResponse = {
	ethics: PartyEthics;
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
};
