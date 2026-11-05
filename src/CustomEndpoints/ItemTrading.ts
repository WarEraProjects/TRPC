export type ItemTradingGetItemTradingInput = {
	itemCode: string;
};

/** One day of an item's market trades. */
export type ItemTradingValue = {
	/** The day as `YYYY-MM-DD`. */
	valueAt: string;
	/** `totalValue / totalQuantity`. */
	avgValue: number;
	totalValue: number;
	totalQuantity: number;
	transactionsCount: number;
};

/**
 * `values` covers the last 30 days, oldest first; the last row is the current, unfinished day.
 * A code without a trading record, such as `toolbox`, answers 404 `NOT_FOUND`.
 */
export type ItemTradingGetItemTradingResponse = {
	_id: string;
	itemCode: string;
	minPrice?: number;
	maxPrice?: number;
	values: ItemTradingValue[];
	/** The last row's `avgValue`. */
	currentValue: number;
	/** Empty in the live sample. */
	sellOrders: unknown[];
	/** Empty in the live sample. */
	buyOrders: unknown[];
	__v: number;
};

export type ItemTradingCustomEndpoints = {
	"itemTrading.getItemTrading": {
		input: ItemTradingGetItemTradingInput;
		output: ItemTradingGetItemTradingResponse;
	};
};
