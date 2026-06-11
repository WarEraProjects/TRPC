export type AllianceGetByIdInput = {
	allianceId: string;
};

export type AllianceGetByIdsInput = {
	ids: string[];
};

export type AllianceGetManyPaginatedInput = {
	limit?: number;
	cursor?: string;
};

export interface AllianceRankingEntry {
	value: number;
	rank: number;
	tier: string;
}

export interface AllianceRankings {
	allianceInitialDevelopment: AllianceRankingEntry;
	allianceDevelopment: AllianceRankingEntry;
	allianceWeeklyDamages: AllianceRankingEntry;
	allianceDamages: AllianceRankingEntry;
	alliancePopulation: AllianceRankingEntry;
	allianceWeeklyDamagesPerCitizen: AllianceRankingEntry;
}

export interface AllianceMemberCountry {
	country: string;
	coreDevelopment: number;
	averageDevelopment: number;
	suspended: boolean;
}

export type Alliance = {
	_id: string;
	name: string;
	scheme: string;
	mapAccent: string;
	leader: string;
	memberCountries: AllianceMemberCountry[];
	currentDevelopment: number;
	coreDevelopment: number;
	averageDevelopment: number;
	createdAt: string;
	updatedAt: string;
	__v: number;
	rankings: AllianceRankings;
	avatarUrl?: string;
};

export type AllianceGetManyPaginatedResponse = {
	items: Alliance[];
	nextCursor?: string;
};

export type AllianceCustomEndpoints = {
	"alliance.getById": {
		input: AllianceGetByIdInput;
		output: Alliance;
	};
	"alliance.getByIds": {
		input: AllianceGetByIdsInput;
		output: Alliance[];
	};
	"alliance.getManyPaginated": {
		input: AllianceGetManyPaginatedInput;
		output: AllianceGetManyPaginatedResponse;
	};
};
