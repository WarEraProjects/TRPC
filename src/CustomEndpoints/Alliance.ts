import type { CountryStrategicResources } from "../api/Responses";

export type AllianceGetByIdInput = {
	allianceId: string;
};

export type AllianceGetStrategicResourceBonusesInput = {
	allianceId: string;
};

/**
 * The strategic resources a group of countries holds together and the bonuses they give: an
 * alliance's members, or one country outside every alliance.
 */
export type StrategicResourceBonuses = {
	/** Absent for a country outside every alliance. */
	allianceId?: string;
	/**
	 * The countries that share the bonuses. For each of the 15 alliances on 2026-11-10 it was the
	 * member list; none had a suspended member that day.
	 */
	countryIds: string[];
	/** Region ids by strategic resource; a resource the group does not hold has no key. */
	regionIds: CountryStrategicResources;
	bonuses: {
		/**
		 * The bonus by skill code, for the skills that get one. On 2026-11-10 the codes were
		 * `energy`, `health`, `lootChance`, `management`, `precision` and `production`.
		 */
		skills: Record<string, number>;
		/** 0 for all 15 alliances and every country checked on 2026-11-10. */
		productionPercent: number;
		/** 0 for all 15 alliances and every country checked on 2026-11-10. */
		developmentPercent: number;
	};
};

export type AllianceGetByIdsInput = {
	ids: string[];
};

/** Cursor-paginated. The explorer also lists a `page` parameter, but the server ignores it. */
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
	/** `null` for an unknown alliance id. Answers without an API key. */
	"alliance.getStrategicResourceBonuses": {
		input: AllianceGetStrategicResourceBonusesInput;
		output: (StrategicResourceBonuses & { allianceId: string }) | null;
	};
};
