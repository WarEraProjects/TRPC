import type { RegionsObjectItem } from "../api/Responses";

/**
 * `region.getAll` returns the same documents as `region.getRegionsObject`, always with
 * `currentPopulation`. When present, `activeBattle` is a populated battle object, not an id.
 */
export type Region = RegionsObjectItem & {
	currentPopulation: number;
};

export type RegionCustomEndpoints = { "region.getAll": { output: Region[] } };
