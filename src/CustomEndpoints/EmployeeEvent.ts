/** `employeeEvent.*` needs an API key: without one the server answers 401 "API token required". */

export type EmployeeEventGetHistoryInput = {
	/** One of the API key owner's employees; another owner's employee returned an empty list in one check. */
	employeeId: string;
};

/** The game client's values; `resolved` was seen live. */
export type EmployeeEventStatus = "scheduled" | "pending" | "resolved" | "cancelled";

export type EmployeeEventBand = "crit" | "success" | "fail" | "critFail";

export type EmployeeEventCastMember = {
	employee: string;
	name: string;
	gender: "male" | "female";
	nationality: string;
	company: string;
};

export type EmployeeEventCost = {
	/** `money` or `energy` in the live samples. */
	type: string;
	amount: number;
};

/** One term of an option's success chance. */
export type EmployeeEventChanceLine = {
	source: string;
	value: number;
	input?: number;
	stat?: string;
	trait?: string;
};

export type EmployeeEventOption = {
	costs: EmployeeEventCost[];
	/** Success chance in percent; absent on an option without a roll. */
	chance?: number;
	lines?: EmployeeEventChanceLine[];
	/** A roll below this is a critical success. */
	critBelow?: number;
	/** A roll from this value up is a critical failure. */
	critFailFrom?: number;
};

export type EmployeeEventAppliedEffect = {
	type: string;
	employee: string;
	delta?: number;
	stat?: string;
	until?: string;
	value?: number;
};

export type EmployeeEventOutcome = {
	/** Index into `options`. */
	option: number;
	band: EmployeeEventBand;
	/** `true` when the game picked the option itself. */
	auto: boolean;
	/** Absent when the picked option has no roll. */
	roll?: number;
	applied: EmployeeEventAppliedEffect[];
};

export type EmployeeEvent = {
	_id: string;
	/** The owner's user id. */
	owner: string;
	code: string;
	status: EmployeeEventStatus;
	/** Employee ids. */
	participants: string[];
	cast: EmployeeEventCastMember[];
	/** Event-specific values such as `itemCode`, `wage` or `toolFamily`. */
	params: Record<string, unknown>;
	options: EmployeeEventOption[];
	/** Index into `options`. */
	defaultOption: number;
	expiresAt: string;
	/** Set once the event is resolved. */
	resolvedAt?: string;
	/** Set once the event is resolved. */
	outcome?: EmployeeEventOutcome;
	createdAt: string;
	updatedAt: string;
};

export type EmployeeEventCustomEndpoints = {
	/**
	 * The API key owner's events, described as the pending ones plus auto-picked outcomes not
	 * yet seen. The live sample was empty; rows are typed as the documents `getHistory` returns.
	 */
	"employeeEvent.getMine": { output: EmployeeEvent[] };
	/** How many events wait for the API key owner. */
	"employeeEvent.getPendingCount": { output: number };
	/** Newest first. */
	"employeeEvent.getHistory": {
		input: EmployeeEventGetHistoryInput;
		output: EmployeeEvent[];
	};
};
