import type { StrategicResourceBonuses } from "./Alliance";

export type CountryGetUnrestDataInput = { countryId: string };
export type CountryUnrestData = {
	bar: number;
	barMax: number;
	lastContributionAt?: string | null;
	isFull: boolean;
	isOnRevolutionCooldown: boolean;
};
export type CountryGetStrategicResourceBonusesInput = { countryId: string };
export type CountryCustomEndpoints = {
	"country.getUnrestData": { input: CountryGetUnrestDataInput; output: CountryUnrestData };
	/**
	 * A member of an alliance gets what `alliance.getStrategicResourceBonuses` returns for its
	 * alliance. A country outside every alliance gets its own regions, without `allianceId`, or
	 * `null` when it holds no strategic resource (all 5 such countries checked on 2026-11-10).
	 * An unknown country id gives `null` too. Answers without an API key.
	 */
	"country.getStrategicResourceBonuses": {
		input: CountryGetStrategicResourceBonusesInput;
		output: StrategicResourceBonuses | null;
	};
};
