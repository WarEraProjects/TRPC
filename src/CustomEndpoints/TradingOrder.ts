/** Any one owner id selects the orders; with no owner the server returns empty lists. */
export type TradingOrderGetPublicOrdersByOwnerInput = {
	countryId?: string;
	userId?: string;
	muId?: string;
	partyId?: string;
};

export type PublicTradingOrder = {
	_id: string;
	user: string;
	/** Present on country-owned orders. */
	country?: string;
	/** Present on MU-owned orders. */
	mu?: string;
	/** Expected on party-owned orders by symmetry; no party-owned order was observed live. */
	party?: string;
	itemCode: string;
	quantity: number;
	price: number;
	offerAt: string;
	type: "buy" | "sell";
	__v: number;
};

export type TradingOrderGetPublicOrdersByOwnerResponse = {
	buyOrders: PublicTradingOrder[];
	sellOrders: PublicTradingOrder[];
	allOrders: PublicTradingOrder[];
	totalBuyMoneyInvested: number;
	totalSellMoneyExpected: number;
	totalSellQuantities: Record<string, number>;
};

export type TradingOrderCustomEndpoints = {
	"tradingOrder.getPublicOrdersByOwner": {
		input: TradingOrderGetPublicOrdersByOwnerInput;
		output: TradingOrderGetPublicOrdersByOwnerResponse;
	};
};
