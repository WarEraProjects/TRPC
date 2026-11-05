/**
 * @deprecated Legacy: v0.27 removed deposits and the strategic-resource production bonus for
 * companies, and on 2026-11-04 the server returned an empty list for all 13 item codes tried, with
 * and without `includeDeposit`. Before that it ignored the explorer's `count` parameter and
 * returned five regions.
 */
export type CompanyGetRecommendedRegionIdsByItemCodeInput = {
	itemCode: string;
	includeDeposit?: boolean;
};

export type CompanyGetProductionBonusInput = {
	companyId: string;
};

/**
 * @deprecated Legacy: v0.27 removed deposits and the strategic-resource production bonus for
 * companies. The server still answers, but only with these two fields, and both were 0 for all 24
 * companies of 15 owners checked on 2026-11-04.
 */
export type CompanyProductionBonusResponse = {
	/** @deprecated Deposits were removed in v0.27; 0 in every live check. */
	depositBonus: number;
	/** @deprecated No company production bonus is left after v0.27; 0 in every live check. */
	total: number;
};

/**
 * @deprecated Legacy: these rows describe the deposit, strategic-resource and ethic bonuses that
 * v0.27 removed. The procedure returned no rows on 2026-11-04, so they could not be rechecked.
 */
export interface RecommendedRegion {
	regionId: string;
	bonus: number;
	/** @deprecated Deposits were removed in v0.27. */
	depositBonus: number;
	/** @deprecated Ethics and deposits were removed in v0.27. */
	ethicDepositBonus: number;
	/** @deprecated The strategic-resource production bonus was removed in v0.27. */
	strategicBonus: number;
	/** @deprecated Ethics were removed in v0.27. */
	ethicSpecializationBonus: number;
	taxPercent: number;
	/** @deprecated Deposits were removed in v0.27. */
	depositEndAt?: string;
	itemCode?: string;
}

/** @deprecated See `RecommendedRegion`. */
export type RecommendedRegions =
	RecommendedRegion[];

export type CompanyCustomEndpoints = {
	/** @deprecated Legacy since v0.27, which removed deposits and the strategic-resource bonus; returns an empty list. */
	"company.getRecommendedRegionIdsByItemCode": {
		input: CompanyGetRecommendedRegionIdsByItemCodeInput;
		output: RecommendedRegions;
	};
	/** @deprecated Legacy since v0.27, which removed deposits and the strategic-resource bonus; both fields come back as 0. */
	"company.getProductionBonus": {
		input: CompanyGetProductionBonusInput;
		output: CompanyProductionBonusResponse;
	};
};
