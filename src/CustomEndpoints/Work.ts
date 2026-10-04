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
	workerId: string;
	companyId: string;
	/** Between 1 and 60. */
	days?: number;
	timezone?: string;
};

export type WorkStatsItem = {
	dailyDate: string;
	total: number;
	wage: number;
	employeeProd: number;
	selfWork: number;
	automatedEngine: number;
};

export type WorkGetStatsByWorkerInput = {
	workerId: string;
	/** Between 1 and 60. */
	days?: number;
	timezone?: string;
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
