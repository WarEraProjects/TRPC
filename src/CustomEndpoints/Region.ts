import type { RegionDates, RegionDeposit, RegionStats } from "../api/Responses";

export type RegionUpgrade = {
  level: number;
  constructionPoints?: number;
  investedMoney?: number;
  constructionStartedAt?: string | null;
  constructionEndedAt?: string | null;
  isUnderConstruction?: boolean | null;
  status?: string;
  statusChangedAt?: string;
  /** No populated construction history was validated. */
  lastConstructions?: unknown[];
};
export type Region = {
  _id: string;
  code: string;
  name: string;
  mainCity: string;
  country: string;
  countryCode: string;
  initialCountry: string;
  neighbors: string[];
  isCapital: boolean;
  isLinkedToCapital: boolean;
  development: number;
  baseDevelopment: number;
  position: number[];
  biome: string;
  climate: string;
  stats: RegionStats;
  dates: RegionDates;
  upgradesV2: { upgrades: Record<string, RegionUpgrade>; activeConstructionCount: number };
  resistance: number;
  resistanceMax: number;
  activeUpgradeLevels?: Record<string, number>;
  activeBattle?: string;
  currentPopulation?: number;
  population?: number;
  residents?: number;
  deposit?: RegionDeposit;
  strategicResource?: string;
  hasCoast?: boolean;
  lastResistanceContributionAt?: string;
  lastRevoltEndedAt?: string;
  lastBattleEndedAt?: string;
  __v: number;
};
export type RegionCustomEndpoints = { "region.getAll": { output: Region[] } };
