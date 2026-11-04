/**
 * The explorer also lists a `count` parameter; the server ignored it and returned five regions.
 * On 2026-11-04 it returned an empty list for all 13 item codes tried, with and without
 * `includeDeposit`, so the `RecommendedRegion` fields below could not be rechecked.
 */
export type CompanyGetRecommendedRegionIdsByItemCodeInput = {
	itemCode: string;
	includeDeposit?: boolean;
};

export type CompanyGetProductionBonusInput = {
	companyId: string;
};

/** The live API returns only these two fields; the strategic and ethic parts are gone (checked 2026-11-04). */
export type CompanyProductionBonusResponse = {
	depositBonus: number;
	total: number;
};

export interface RecommendedRegion {
	regionId: string;
	bonus: number;
	depositBonus: number;
	ethicDepositBonus: number;
	strategicBonus: number;
	ethicSpecializationBonus: number;
	taxPercent: number;
	depositEndAt?: string;
	itemCode?: string;
}

export type RecommendedRegions =
	RecommendedRegion[];

export type CompanyCustomEndpoints = {
	"company.getRecommendedRegionIdsByItemCode": {
		input: CompanyGetRecommendedRegionIdsByItemCodeInput;
		output: RecommendedRegions;
	};
	"company.getProductionBonus": {
		input: CompanyGetProductionBonusInput;
		output: CompanyProductionBonusResponse;
	};
};
