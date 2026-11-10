export type BattleGetActiveBattlesByCountryInput = {
	countryId: string;
};

export type BattleGetViewersCountInput = {
	battleId: string;
};

/** Both `battle` procedures here answer without an API key. */
export type BattleCustomEndpoints = {
	/** Ids of the active battles the country fights as attacker or defender; an empty list when there are none. */
	"battle.getActiveBattlesByCountry": {
		input: BattleGetActiveBattlesByCountryInput;
		output: string[];
	};
	/** The battle's current viewer count. */
	"battle.getViewersCount": {
		input: BattleGetViewersCountInput;
		output: number;
	};
};
