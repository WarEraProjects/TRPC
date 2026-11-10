/** Every `managerOffer` procedure here answers without an API key. */

export type ManagerOfferWageProfile = {
	management: number;
	/** A country id. */
	citizenship?: string;
};

export type ManagerOfferGetWageStatsInput = {
	/** With a profile, `topEligibleOffer` is the best offer it qualifies for. */
	profile?: ManagerOfferWageProfile;
};

export type ManagerOfferWageStats = {
	/** The `maxHourlyWage` range the game allows for an offer: 80% to 120% of `average`. */
	allowedRange: {
		min: number;
		max: number;
		average: number;
		/** `market` in the live sample. */
		source: string;
	};
	/** The highest `maxHourlyWage` among open offers. */
	topOffer: number;
	/** `null` without a `profile`. */
	topEligibleOffer: number | null;
};

export type ManagerOfferGetManyPaginatedInput = {
	/** Between 1 and 50; the server returns 20 without it. */
	limit?: number;
	cursor?: string;
	/** Only offers in this country's regions. */
	countryId?: string;
};

export type ManagerOffer = {
	_id: string;
	company: string;
	/** The company owner's user id. */
	user: string;
	region: string;
	rateManagement: number;
	maxHourlyWage: number;
	/**
	 * The lowest management level an applicant needs. An offer can set this, `citizenship`, both
	 * or neither: of 50 open offers on 2026-11-09, 46 set it, 4 set `citizenship`, 1 set both and
	 * 1 set neither.
	 */
	minManagement?: number;
	/** A country id: the citizenship an applicant needs. */
	citizenship?: string;
	createdAt: string;
	updatedAt: string;
	__v: number;
};

/** The highest `maxHourlyWage` comes first. */
export type ManagerOfferGetManyPaginatedResponse = { items: ManagerOffer[]; nextCursor?: string | null };

export type ManagerOfferGetByCompanyIdInput = {
	companyId: string;
};

export type ManagerOfferCustomEndpoints = {
	"managerOffer.getWageStats": {
		input: ManagerOfferGetWageStatsInput;
		output: ManagerOfferWageStats;
	};
	"managerOffer.getManyPaginated": {
		input: ManagerOfferGetManyPaginatedInput;
		output: ManagerOfferGetManyPaginatedResponse;
	};
	/** `null` when the company has no open offer. */
	"managerOffer.getByCompanyId": {
		input: ManagerOfferGetByCompanyIdInput;
		output: ManagerOffer | null;
	};
};
