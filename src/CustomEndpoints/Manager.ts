export type ManagerGetByCompanyIdInput = {
	companyId: string;
};

/** A company's hired manager, typed from one live sample. */
export type Manager = {
	_id: string;
	/** The manager's user id. */
	user: string;
	company: string;
	/** The company owner's user id. */
	employer: string;
	managementLevel: number;
	productionBonusPercent: number;
	rateManagement: number;
	/** Money per hour. */
	hourlyWage: number;
	maxHourlyWage: number;
	accrued: number;
	unpaidHours: number;
	totalEarned: number;
	isInactive: boolean;
	hasPendingRateReduction: boolean;
	hiredAt: string;
	lockedUntil: string;
	canEndAt: string;
	movedAt?: string;
	lastAccruedAt?: string;
	createdAt: string;
	updatedAt: string;
	__v: number;
};

export type ManagerCustomEndpoints = {
	/** `null` when the company has no manager. Answers without an API key. */
	"manager.getByCompanyId": {
		input: ManagerGetByCompanyIdInput;
		output: Manager | null;
	};
};
