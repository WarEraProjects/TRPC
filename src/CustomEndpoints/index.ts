export type * from "./Alliance";
export type * from "./Article";
export type * from "./Company";
export type * from "./Contribution";
export type * from "./Country";
export type * from "./CountryDiplomacy";
export type * from "./Donation";
export type * from "./Election";
export type * from "./GameStat";
export type * from "./Giveaway";
export type * from "./MuMember";
export type * from "./Party";
export type * from "./Region";
export type * from "./Sanction";
export type * from "./Search";
export type * from "./Shop";
export type * from "./Tournament";
export type * from "./TradingOrder";
export type * from "./UpgradeConstruction";
export type * from "./War";
export type * from "./Work";
export type * from "./WorkOffer";

import type { AllianceCustomEndpoints } from "./Alliance";
import type { ArticleCustomEndpoints } from "./Article";
import type { CompanyCustomEndpoints } from "./Company";
import type { ContributionCustomEndpoints } from "./Contribution";
import type { CountryCustomEndpoints } from "./Country";
import type { CountryDiplomacyCustomEndpoints } from "./CountryDiplomacy";
import type { DonationCustomEndpoints } from "./Donation";
import type { ElectionCustomEndpoints } from "./Election";
import type { GameStatCustomEndpoints } from "./GameStat";
import type { GiveawayCustomEndpoints } from "./Giveaway";
import type { MuMemberCustomEndpoints } from "./MuMember";
import type { PartyCustomEndpoints } from "./Party";
import type { RegionCustomEndpoints } from "./Region";
import type { SanctionCustomEndpoints } from "./Sanction";
import type { SearchCustomEndpoints } from "./Search";
import type { ShopCustomEndpoints } from "./Shop";
import type { TournamentCustomEndpoints } from "./Tournament";
import type { TradingOrderCustomEndpoints } from "./TradingOrder";
import type { UpgradeConstructionCustomEndpoints } from "./UpgradeConstruction";
import type { WarCustomEndpoints } from "./War";
import type { WorkCustomEndpoints } from "./Work";
import type { WorkOfferCustomEndpoints } from "./WorkOffer";

export type WarEraCustomEndpoints =
	AllianceCustomEndpoints
	& ArticleCustomEndpoints
	& CompanyCustomEndpoints
	& ContributionCustomEndpoints
	& CountryCustomEndpoints
	& CountryDiplomacyCustomEndpoints
	& DonationCustomEndpoints
	& ElectionCustomEndpoints
	& GameStatCustomEndpoints
	& GiveawayCustomEndpoints
	& MuMemberCustomEndpoints
	& PartyCustomEndpoints
	& RegionCustomEndpoints
	& SanctionCustomEndpoints
	& SearchCustomEndpoints
	& ShopCustomEndpoints
	& TournamentCustomEndpoints
	& TradingOrderCustomEndpoints
	& UpgradeConstructionCustomEndpoints
	& WarCustomEndpoints
	& WorkCustomEndpoints
	& WorkOfferCustomEndpoints;
