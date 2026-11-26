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
	/** On half of the `getStatsByUserId` rows read on 2026-11-24. */
	workerProd?: number;
};

export type WorkGetLastByEmployeeInput = {
	employeeId: string;
	/** A whole number from 1 to 50; 20 without it. */
	limit?: number;
};

/** One work shift of an employee. */
export type EmployeeWork = {
	_id: string;
	wage: number;
	production: number;
	/** The tool used, on 348 of 600 rows read on 2026-11-24. */
	tool?: { code: string; skills: { production: number }; state: number; maxState: number };
	/** `"toolbox"` on 6 of 600 rows read on 2026-11-24. */
	foundItemCode?: string;
	createdAt: string;
};

export type WorkGetStatsByEmployeeInput = {
	employeeId: string;
	/** A whole number from 1 to 60; 30 without it. */
	days?: number;
};

/** One day of an employee's work, all 0 on a day without any. `total` equalled `employeeProd` on every row read. */
export type EmployeeWorkStatsItem = {
	dailyDate: string;
	total: number;
	wage: number;
	employeeProd: number;
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
	/**
	 * An employee's latest shifts, newest first. Answers for any owner's employee, and with `[]`
	 * for an unknown id. Needs an API key: without one it answers `UNAUTHORIZED`. Checked with
	 * one key on 2026-11-24; whether it needs Premium like the two procedures above is unverified.
	 */
	"work.getLastByEmployee": {
		input: WorkGetLastByEmployeeInput;
		output: EmployeeWork[];
	};
	/**
	 * An employee's work per day, oldest first: one row for each day from `days` days ago through
	 * today, so `days` + 1 rows, with zeros on a day without work. On 2026-11-24 no row was older
	 * than 2026-10-26, and an employee without work in the span returned `[]`. Answers for any
	 * owner's employee, and with `[]` for an unknown id. Needs an API key, under the same caveat
	 * as `work.getLastByEmployee`.
	 */
	"work.getStatsByEmployee": {
		input: WorkGetStatsByEmployeeInput;
		output: EmployeeWorkStatsItem[];
	};
};
