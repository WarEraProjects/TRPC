export type GameStatGetEquipmentAvgByCodeInput = {
	itemCode: string;
};

/**
 * How many users reached a badge or a milestone tier. `percent` is `count` as a percentage of one
 * base shared by every row: about 13,400 users on 2026-11-09.
 */
export type GameStatHolderCount = {
	count: number;
	percent: number;
};

export type GameStatCustomEndpoints = {
	"gameStat.getWorldDevelopment": { output: number };
	"gameStat.getEquipmentAvgByCode": {
		input: GameStatGetEquipmentAvgByCodeInput;
		output: number;
	};
	/** Money value of one production point. */
	"gameStat.getPpMoneyValue": { output: number };
	/** Money value of one production point, keyed by item code. */
	"gameStat.getPpMoneyValueByItem": { output: Record<string, number> };
	/** Keyed by badge code, such as `alphaTester` or `countryPresident`. */
	"gameStat.getBadgeStats": { output: Record<string, GameStatHolderCount> };
	/** Keyed by milestone code, then by tier number as a string (`"1"`, `"2"`, …). */
	"gameStat.getMilestoneStats": { output: Record<string, Record<string, GameStatHolderCount>> };
};
