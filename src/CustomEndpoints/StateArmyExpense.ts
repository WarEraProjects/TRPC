/** What the state spent on its military units for. No `revokeLaw` entry was seen on 2026-11-24. */
export type StateArmyExpenseKind = "hqOil" | "contract" | "sponsorLaw" | "revokeLaw";

export type StateArmyExpenseGetOverviewInput = {
	countryId: string;
	/** The last 1 to 365 days. Without it the totals cover all time and `byDay` is empty. */
	days?: number;
};

export type StateArmyExpenseTotal = {
	kind: StateArmyExpenseKind;
	/** Items spent: `hqOil` and `sponsorLaw` spend items, `contract` spends money. */
	quantity: number;
	money: number;
};

export type StateArmyExpenseOverview = {
	byKind: StateArmyExpenseTotal[];
	byUnit: (StateArmyExpenseTotal & { mu: string })[];
	/** `day` is `YYYY-MM-DD`. Empty without `days`. */
	byDay: (StateArmyExpenseTotal & { day: string })[];
};

export type StateArmyExpenseGetLedgerInput = {
	countryId: string;
	kind?: StateArmyExpenseKind;
	/** From 1 to 100. */
	limit?: number;
	cursor?: string;
};

/**
 * One expense. On 2026-11-24 `hqOil` entries carried `itemCode` and `quantity`, `sponsorLaw`
 * entries those and `refId`, and `contract` entries `money` and `refId`.
 */
export type StateArmyExpenseEntry = {
	_id: string;
	country: string;
	mu: string;
	kind: StateArmyExpenseKind;
	/** `oil` for `hqOil`, `paper` for `sponsorLaw` on 2026-11-24. */
	itemCode?: string;
	quantity?: number;
	money?: number;
	/**
	 * On a `sponsorLaw` entry the sponsorship's `law`. A `contract` entry carries another id; what it
	 * points to is unverified.
	 */
	refId?: string;
	/** `YYYY-MM-DD`. */
	day: string;
	at: string;
	createdAt: string;
	updatedAt: string;
	__v: number;
};

export type StateArmyExpenseGetLedgerResponse = {
	items: StateArmyExpenseEntry[];
	nextCursor?: string;
};

export type StateArmyExpenseCustomEndpoints = {
	/** The country's spending on its military units, by kind, unit and day. Answers without an API key. */
	"stateArmyExpense.getOverview": {
		input: StateArmyExpenseGetOverviewInput;
		output: StateArmyExpenseOverview;
	};
	/** Single expenses, newest `at` first. Answers without an API key. */
	"stateArmyExpense.getLedger": {
		input: StateArmyExpenseGetLedgerInput;
		output: StateArmyExpenseGetLedgerResponse;
	};
};
