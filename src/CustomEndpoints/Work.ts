/**
 * `getStatsByWorker`, `getStatsByUserId`, and `getStatsByCompany` require a
 * WarEra Premium API key; normal keys receive HTTP 403 "Premium required".
 * `getStatsByWorkerAndCompany` has been reported to return HTTP 401 even with an
 * API key, suggesting session authentication may be required for some accounts;
 * live checks with a Premium key also succeeded without a session.
 * `days` defaults server-side and is capped at 60.
 * `workerId` is the worker's **user** id, not the worker document `_id` returned by
 * `worker.getWorkers`; the document id returns an empty array.
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

export type WorkGetStatsByWorkerAndCompanyInput = {
	/** The worker's user id. */
	workerId: string;
	companyId: string;
	/** Between 1 and 60. */
	days?: number;
	timezone?: string;
};

export type WorkGetStatsByWorkerInput = {
	/** The worker's user id. */
	workerId: string;
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
	"work.getStatsByWorker": { input: WorkGetStatsByWorkerInput; output: WorkStatsItem[] };
	"work.getStatsByUserId": {
		input: WorkGetStatsByUserIdInput;
		output: WorkStatsItem[];
	};
	"work.getStatsByCompany": {
		input: WorkGetStatsByCompanyInput;
		output: WorkStatsItem[];
	};
	/** API-key access varies: HTTP 401 was reported, but live Premium-key checks succeeded. */
	"work.getStatsByWorkerAndCompany": {
		input: WorkGetStatsByWorkerAndCompanyInput;
		output: WorkStatsItem[];
	};
};
