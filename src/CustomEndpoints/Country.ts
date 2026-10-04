export type CountryGetUnrestDataInput = { countryId: string };
export type CountryUnrestData = {
  bar: number;
  barMax: number;
  lastContributionAt?: string | null;
  isFull: boolean;
  isOnRevolutionCooldown: boolean;
};
export type CountryCustomEndpoints = {
  "country.getUnrestData": { input: CountryGetUnrestDataInput; output: CountryUnrestData };
};
