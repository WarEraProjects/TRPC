/**
 * Every `work.*` procedure requires the calling API key to belong to a WarEra Premium
 * account; other keys get `Unauthorized`. `days` defaults server-side and is capped at 60.
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
	"work.getStatsByWorkerAndCompany": {
		input: WorkGetStatsByWorkerAndCompanyInput;
		output: WorkStatsItem[];
	};
};
