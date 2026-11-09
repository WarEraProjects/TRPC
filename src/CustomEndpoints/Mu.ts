export type MuGetReputationBuyStatusInput = {
	muId: string;
};

/** Whether the MU can buy mercenary reputation now, at what cost and for how much. */
export type MuReputationBuyStatus = {
	/** `false` for every MU checked on 2026-11-09, with and without an API key. */
	canBuy: boolean;
	cost: number;
	amount: number;
	/** The MU's `mercenaryReputation`. */
	currentReputation: number;
};

export type MuCustomEndpoints = {
	/** Answers without an API key. */
	"mu.getReputationBuyStatus": {
		input: MuGetReputationBuyStatusInput;
		output: MuReputationBuyStatus;
	};
};
