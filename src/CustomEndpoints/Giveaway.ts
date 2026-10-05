export type GiveawayGetManyPaginatedInput = {
	/** Between 1 and 100. */
	limit?: number;
	cursor?: string;
};
export type Giveaway = {
	_id: string;
	prize: Record<string, number>;
	winnersQuantity: number;
	participants: string[];
	winners: string[];
	startAt: string;
	endAt: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	__v: number;
};
export type GiveawayGetManyPaginatedResponse = { items: Giveaway[]; nextCursor?: string | null };
export type GiveawayCustomEndpoints = {
	"giveaway.getManyPaginated": {
		input: GiveawayGetManyPaginatedInput;
		output: GiveawayGetManyPaginatedResponse;
	};
};
