export type UpgradeConstructionGetRegionConstructionsInput = { regionId: string };
export type UpgradeConstructionListConstructionsInput = {
  regionId?: string;
  countryId?: string;
  limit?: number;
  cursor?: string;
};
/** Live and saved samples were empty; construction item fields remain unverified. */
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
