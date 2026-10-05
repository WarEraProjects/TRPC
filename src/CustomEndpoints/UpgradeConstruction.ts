export type UpgradeConstructionGetRegionConstructionsInput = { regionId: string };

/** The server requires `regionId` or `countryId` (both may be given). */
export type UpgradeConstructionListConstructionsInput = (
	| { regionId: string; countryId?: string }
	| { countryId: string; regionId?: string }
) & {
	limit?: number;
	/** The `_id` of the last construction document on the previous page. */
	cursor?: string;
};

/** Every live sample so far was empty, so the construction item shape is unverified. */
export type UpgradeConstruction = unknown;

export type UpgradeConstructionListConstructionsResponse = {
	items: UpgradeConstruction[];
	nextCursor?: string | null;
};

export type UpgradeConstructionCustomEndpoints = {
	"upgradeConstruction.getMapConstructions": { output: UpgradeConstruction[] };
	"upgradeConstruction.getRegionConstructions": {
		input: UpgradeConstructionGetRegionConstructionsInput;
		output: UpgradeConstruction[];
	};
	"upgradeConstruction.listConstructions": {
		input: UpgradeConstructionListConstructionsInput;
		output: UpgradeConstructionListConstructionsResponse;
	};
};
