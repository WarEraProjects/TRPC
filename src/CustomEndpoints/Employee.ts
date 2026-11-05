/**
 * `employee.*` needs an API key: without one the server answers 401 "API token required".
 * The `getMy*` procedures read the key owner's workforce; the others accept any company or employee.
 */

export type EmployeeGetCompanyEmployeesInput = {
	companyId: string;
};

export type EmployeeGetCompanyRosterInput = {
	companyId: string;
};

export type EmployeeGetCompanyEstimateInput = {
	companyId: string;
};

export type EmployeeGetManagerPointValueInput = {
	companyId: string;
};

export type EmployeeGetByIdInput = {
	/** The employee's id, not a user id. */
	employeeId: string;
};

export type EmployeeStats = {
	production: number;
	luck: number;
	responsibility: number;
};

export type EmployeeStatName = keyof EmployeeStats;

export type EmployeeTrait = {
	code: string;
	/** The trait's target, such as an item code or a stat name. */
	arg?: string;
};

export type EmployeeGainedTrait = EmployeeTrait & {
	revealed?: boolean;
};

export type EmployeeTrainingOutcome = {
	stat?: EmployeeStatName;
	statGain?: number;
	wageExpectation?: number;
	potentialMax?: number;
	gained?: EmployeeGainedTrait[];
	/** Trait codes. */
	lost?: string[];
};

/** One picked training card; which fields appear depends on the card. */
export type EmployeeTrainingHistoryEntry = {
	card: string;
	rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
	delta?: number;
	stat?: EmployeeStatName;
	trait?: string;
	traitTo?: string;
	traitTo2?: string;
	outcome: EmployeeTrainingOutcome;
	pickedAt: string;
};

export type EmployeeEstimate = {
	/** Production points per hour, not money; 0 while the company is disabled. */
	production: number;
	/** Money per hour. */
	wage: number;
	/** The item the employee's company produces. */
	itemCode: string;
};

export type EmployeeStatContribution = {
	code: string;
	delta: number;
	/** `true` when `delta` is a percentage rather than points. */
	percent?: boolean;
};

export type EmployeeStatBreakdown = {
	base: number;
	trained: number;
	contributions: EmployeeStatContribution[];
	total: number;
};

export type EmployeeHappinessContribution = {
	reason: string;
	delta: number;
	/** The trait behind a trait or coworker reason. */
	code?: string;
	/** Set on event effects, with `until`. */
	eventCode?: string;
	until?: string;
};

export type EmployeeHappinessBreakdown = {
	base: number;
	contributions: EmployeeHappinessContribution[];
	mitigated: number;
	value: number;
	quitChance: number;
};

export type EmployeeProductionBonusContribution = {
	source: string;
	percent: number;
};

export type EmployeeProductionBonus = {
	/** Percent. */
	total: number;
	contributions: EmployeeProductionBonusContribution[];
};

export type EmployeeEventModifier = {
	code: string;
	kind: string;
	delta: number;
	until: string;
};

export type EmployeeToolStatus = {
	rolledPercent: number;
	bonusPercent: number;
	isUsable: boolean;
	isBroken: boolean;
};

export type EmployeeToolItem = {
	_id: string;
	owner: string;
	code: string;
	skills: { production: number };
	state: number;
	maxState: number;
	employee: string;
	createdAt: string;
	updatedAt: string;
	__v: number;
};

/** One employee, as every `employee.*` procedure returns it. */
export type Employee = {
	_id: string;
	/** The owner's user id. */
	owner: string;
	company: string;
	name: string;
	gender: "male" | "female";
	age: number;
	retireInDays: number;
	/** A UTC day, `YYYY-MM-DD`. */
	lastAgedDay: string;
	/** A country id. */
	nationality: string;
	/** Includes the `trained` points. */
	base: EmployeeStats;
	trained: EmployeeStats;
	traits: EmployeeTrait[];
	potential: number;
	potentialMax: number;
	/** Money per hour. */
	wage: number;
	wageExpectation: number;
	wageNegotiated?: number;
	estimate: EmployeeEstimate;
	breakdown: Record<EmployeeStatName, EmployeeStatBreakdown>;
	happinessBreakdown: EmployeeHappinessBreakdown;
	productionBonus: EmployeeProductionBonus;
	trainingsPerDay: number;
	trainingsToday: number;
	lastTrainedAt?: string;
	trainingHistory: EmployeeTrainingHistoryEntry[];
	trainerSessionsUsed?: number;
	trainerSessionsUsedAt?: string;
	/** Keyed by item code. */
	specializations?: Record<string, number>;
	/** A UTC day, `YYYY-MM-DD`. */
	lastSpecializedDay?: string;
	companyDisabled: boolean;
	lastMovedAt?: string;
	lastEventAt?: string;
	eventModifiers?: EmployeeEventModifier[];
	charmLuck?: { amount: number; until: string };
	careBoosts?: string[];
	coworkerFiredAts?: string[];
	/** The equipped tool's item id. */
	tool?: string;
	toolStatus?: EmployeeToolStatus;
	toolItem?: EmployeeToolItem;
	createdAt: string;
	updatedAt: string;
	__v: number;
};

/** `production` and `wageCost` are the sums of the employees' `estimate.production` and `estimate.wage`. */
export type EmployeeCompanyHourly = {
	itemCode: string;
	/** Production points per hour, not money. */
	production: number;
	toolboxes: number;
	/** Money per hour. */
	wageCost: number;
	/** Money per hour. */
	managerCost: number;
	/** The company's employee slots. */
	cap: number;
	engineMultiplier: number;
};

export type EmployeeGetCompanyRosterResponse = {
	employees: Employee[];
	hourly: EmployeeCompanyHourly;
};

export type EmployeeWorkforceSummary = {
	employeeCount: number;
	trainableCount: number;
	managerCount: number;
	foundToolboxes: number;
	/** Production points per hour, not money. */
	production: number;
	/** Production points per hour, keyed by item code. */
	productionByItem: Record<string, number>;
	toolboxesPerHour: number;
	/** Money per hour. */
	wageCost: number;
	/** Money per hour. */
	managerCost: number;
};

export type EmployeeGetManagerPointValueResponse = {
	/** Production points per hour that one more manager Management point would add. */
	productionPerPoint: number;
};

export type EmployeeCustomEndpoints = {
	/** Every employee the API key's owner has, across all of their companies. */
	"employee.getMyEmployees": { output: Employee[] };
	/** The API key owner's headcount and hourly totals. */
	"employee.getMyWorkforceSummary": { output: EmployeeWorkforceSummary };
	"employee.getCompanyEmployees": {
		input: EmployeeGetCompanyEmployeesInput;
		output: Employee[];
	};
	"employee.getCompanyRoster": {
		input: EmployeeGetCompanyRosterInput;
		output: EmployeeGetCompanyRosterResponse;
	};
	/** `getCompanyRoster`'s `hourly` block without the employees. */
	"employee.getCompanyEstimate": {
		input: EmployeeGetCompanyEstimateInput;
		output: EmployeeCompanyHourly;
	};
	"employee.getManagerPointValue": {
		input: EmployeeGetManagerPointValueInput;
		output: EmployeeGetManagerPointValueResponse;
	};
	/** An unknown id answers `null`. */
	"employee.getById": {
		input: EmployeeGetByIdInput;
		output: Employee | null;
	};
};
