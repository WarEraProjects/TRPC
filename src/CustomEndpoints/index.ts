export type * from "./Alliance";
export type * from "./Article";
export type * from "./ArticleInteraction";
export type * from "./Battle";
export type * from "./Company";
export type * from "./Contribution";
export type * from "./Country";
export type * from "./CountryDiplomacy";
export type * from "./Donation";
export type * from "./Election";
export type * from "./Employee";
export type * from "./EmployeeEvent";
export type * from "./GameConfig";
export type * from "./GameStat";
export type * from "./Giveaway";
export type * from "./ItemTrading";
export type * from "./Manager";
export type * from "./ManagerOffer";
export type * from "./Map";
export type * from "./MercenaryContractAuction";
export type * from "./Mu";
export type * from "./MuMember";
export type * from "./Party";
export type * from "./Region";
export type * from "./Sanction";
export type * from "./Search";
export type * from "./Shop";
export type * from "./Tournament";
export type * from "./TradingOrder";
export type * from "./Upgrade";
export type * from "./UpgradeConstruction";
export type * from "./User";
export type * from "./War";
export type * from "./Work";

import type { AllianceCustomEndpoints } from "./Alliance";
import type { ArticleCustomEndpoints } from "./Article";
import type { ArticleInteractionCustomEndpoints } from "./ArticleInteraction";
import type { BattleCustomEndpoints } from "./Battle";
import type { CompanyCustomEndpoints } from "./Company";
import type { ContributionCustomEndpoints } from "./Contribution";
import type { CountryCustomEndpoints } from "./Country";
import type { CountryDiplomacyCustomEndpoints } from "./CountryDiplomacy";
import type { DonationCustomEndpoints } from "./Donation";
import type { ElectionCustomEndpoints } from "./Election";
import type { EmployeeCustomEndpoints } from "./Employee";
import type { EmployeeEventCustomEndpoints } from "./EmployeeEvent";
import type { GameConfigCustomEndpoints } from "./GameConfig";
import type { GameStatCustomEndpoints } from "./GameStat";
import type { GiveawayCustomEndpoints } from "./Giveaway";
import type { ItemTradingCustomEndpoints } from "./ItemTrading";
import type { ManagerCustomEndpoints } from "./Manager";
import type { ManagerOfferCustomEndpoints } from "./ManagerOffer";
import type { MapCustomEndpoints } from "./Map";
import type { MercenaryContractAuctionCustomEndpoints } from "./MercenaryContractAuction";
import type { MuCustomEndpoints } from "./Mu";
import type { MuMemberCustomEndpoints } from "./MuMember";
import type { PartyCustomEndpoints } from "./Party";
import type { RegionCustomEndpoints } from "./Region";
import type { SanctionCustomEndpoints } from "./Sanction";
import type { SearchCustomEndpoints } from "./Search";
import type { ShopCustomEndpoints } from "./Shop";
import type { TournamentCustomEndpoints } from "./Tournament";
import type { TradingOrderCustomEndpoints } from "./TradingOrder";
import type { UpgradeCustomEndpoints } from "./Upgrade";
import type { UpgradeConstructionCustomEndpoints } from "./UpgradeConstruction";
import type { UserCustomEndpoints } from "./User";
import type { WarCustomEndpoints } from "./War";
import type { WorkCustomEndpoints } from "./Work";

export type WarEraCustomEndpoints =
	AllianceCustomEndpoints
	& ArticleCustomEndpoints
	& ArticleInteractionCustomEndpoints
	& BattleCustomEndpoints
	& CompanyCustomEndpoints
	& ContributionCustomEndpoints
	& CountryCustomEndpoints
	& CountryDiplomacyCustomEndpoints
	& DonationCustomEndpoints
	& ElectionCustomEndpoints
	& EmployeeCustomEndpoints
	& EmployeeEventCustomEndpoints
	& GameConfigCustomEndpoints
	& GameStatCustomEndpoints
	& GiveawayCustomEndpoints
	& ItemTradingCustomEndpoints
	& ManagerCustomEndpoints
	& ManagerOfferCustomEndpoints
	& MapCustomEndpoints
	& MercenaryContractAuctionCustomEndpoints
	& MuCustomEndpoints
	& MuMemberCustomEndpoints
	& PartyCustomEndpoints
	& RegionCustomEndpoints
	& SanctionCustomEndpoints
	& SearchCustomEndpoints
	& ShopCustomEndpoints
	& TournamentCustomEndpoints
	& TradingOrderCustomEndpoints
	& UpgradeCustomEndpoints
	& UpgradeConstructionCustomEndpoints
	& UserCustomEndpoints
	& WarCustomEndpoints
	& WorkCustomEndpoints;
