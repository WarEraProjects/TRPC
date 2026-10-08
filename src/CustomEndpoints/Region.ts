import type { RegionsObjectItem } from "../api/Responses";

/**
 * `region.getAll` returns the same document as `region.getRegionsObject` plus three
 * population counters. When present, `activeBattle` is a populated battle object, not an id.
 */
export type Region = RegionsObjectItem & {
	currentPopulation: number;
	population: number;
	residents: number;
};

export type RegionCustomEndpoints = { "region.getAll": { output: Region[] } };
