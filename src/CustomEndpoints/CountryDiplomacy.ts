export type CountryDiplomacyGetByCountryInput = { countryId: string };
export type CountrySwornEnemy = { enemy: string; bonusPercent: number; damagesDealt: number };
export type CountryDefensivePact = { partner: string; bonusPercent: number; damagesDealt: number };
export type CountryDiplomacy = {
	swornEnemy?: CountrySwornEnemy | null;
	defensivePacts: CountryDefensivePact[];
};
export type CountryDiplomacyCustomEndpoints = {
	"countryDiplomacy.getByCountry": {
		input: CountryDiplomacyGetByCountryInput;
		output: CountryDiplomacy;
	};
};
