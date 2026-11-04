export type GameStatGetEquipmentAvgByCodeInput = {
	itemCode: string;
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
};
