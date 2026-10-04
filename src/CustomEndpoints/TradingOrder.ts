export type TradingOrderGetPublicOrdersByOwnerInput = {
	countryId?: string;
	userId?: string;
	muId?: string;
	partyId?: string;
};

export type PublicTradingOrder = {
	_id: string;
	user: string;
	country: string;
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
	totalSellQuantities: Record<string, number>;
};

export type TradingOrderCustomEndpoints = {
	"tradingOrder.getPublicOrdersByOwner": {
		input: TradingOrderGetPublicOrdersByOwnerInput;
		output: TradingOrderGetPublicOrdersByOwnerResponse;
	};
};
