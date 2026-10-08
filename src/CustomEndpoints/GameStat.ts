export type GameStatGetEquipmentAvgByCodeInput = {
	itemCode: string;
};

export type GameStatCustomEndpoints = {
	"gameStat.getWorldDevelopment": { output: number };
	"gameStat.getEquipmentAvgByCode": {
		input: GameStatGetEquipmentAvgByCodeInput;
		output: number;
	};
};
