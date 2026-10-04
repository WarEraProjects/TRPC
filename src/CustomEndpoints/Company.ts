export type CompanyGetRecommendedRegionIdsByItemCodeInput = {
	itemCode: string;
	includeDeposit?: boolean;
	count?: number;
};

export type CompanyGetProductionBonusInput = {
	companyId: string;
};

export type CompanyProductionBonusResponse = {
	strategicBonus: number;
	depositBonus: number;
	ethicSpecializationBonus: number;
	ethicDepositBonus: number;
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
