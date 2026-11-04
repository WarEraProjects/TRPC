/**
 * `getStatsByUserId` and `getStatsByCompany` require a
 * WarEra Premium API key; normal keys receive HTTP 403 "Premium required".
 * `days` defaults server-side and is capped at 60.
 */
export type WorkGetStatsByUserIdInput = {
	userId: string;
	/** Between 1 and 60. */
	days?: number;
	timezone?: string;
};

export type WorkGetStatsByCompanyInput = {
	companyId: string;
	/** Between 1 and 60. */
	days?: number;
	timezone?: string;
};

/**
 * One row per day with activity. The component fields are omitted on days where they
 * do not apply (and some procedures never return some of them), so only `dailyDate`
 * and `total` are guaranteed.
 */
export type WorkStatsItem = {
	dailyDate: string;
	total: number;
	wage?: number;
	employeeProd?: number;
	selfWork?: number;
	automatedEngine?: number;
};

export type WorkCustomEndpoints = {
	"work.getStatsByUserId": {
		input: WorkGetStatsByUserIdInput;
		output: WorkStatsItem[];
	};
	"work.getStatsByCompany": {
		input: WorkGetStatsByCompanyInput;
		output: WorkStatsItem[];
	};
};
