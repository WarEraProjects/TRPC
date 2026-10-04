/** Populated user projection; additional fields depend on the account and context. */
export type ContributionUser = {
  _id: string;
  username: string;
  isAdmin?: boolean;
  [field: string]: unknown;
};

export type Contribution = {
  _id: string;
  type: string;
  user: ContributionUser;
  country: string;
  region?: string;
  amount: number;
  resource: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export type ContributionGetCountryUnrestContributionsInput = {
  countryId: string;
  /** Starts at 1. */
  page?: number;
  limit?: number;
};
export type ContributionGetRegionContributionsInput = {
  regionId: string;
  /** Starts at 1. */
  page?: number;
  limit?: number;
};
/** Page-based pagination, rather than the SDK's cursor pagination. */
export type ContributionPaginatedResponse = {
  results: Contribution[];
  count: number;
  limit: number;
  page: number;
  pages: number;
  nextPage?: number | null;
};
export type ContributionCustomEndpoints = {
  "contribution.getCountryUnrestContributions": {
    input: ContributionGetCountryUnrestContributionsInput;
    output: ContributionPaginatedResponse;
  };
  "contribution.getRegionContributions": {
    input: ContributionGetRegionContributionsInput;
    output: ContributionPaginatedResponse;
  };
};
