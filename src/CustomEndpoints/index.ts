export type {
	PartyCustomEndpoints,
	PartyEthics,
	PartyGetByIdInput,
	PartyGetByIdResponse,
	PartyGetManyPaginatedInput,
	PartyGetManyPaginatedResponse
} from "./Party";

export type {
	CompanyCustomEndpoints,
	CompanyGetProductionBonusInput,
	CompanyGetRecommendedRegionIdsByItemCodeInput,
	CompanyProductionBonusResponse,
	RecommendedRegion,
	RecommendedRegions
} from "./Company";

export type {
	DonationCustomEndpoints,
	DonationGetManyPaginatedInput,
	DonationGetManyPaginatedResponse,
	DonationGetTotalDonationsInput,
	DonationGetTotalDonationsResponse,
	DonationListItem
} from "./Donation";

export type {
	ElectionCandidate,
	ElectionCustomEndpoints,
	ElectionGetElectionsInput,
	ElectionGetElectionsResponse,
	ElectionListItem
} from "./Election";

export type {
	GameStatCustomEndpoints,
	GameStatGetEquipmentAvgByCodeInput
} from "./GameStat";

export type {
	MuMemberCustomEndpoints,
	MuMemberGetByMuInput,
	MuMemberListItem
} from "./MuMember";

export type {
	PublicTradingOrder,
	TradingOrderCustomEndpoints,
	TradingOrderGetPublicOrdersByOwnerInput,
	TradingOrderGetPublicOrdersByOwnerResponse
} from "./TradingOrder";

export type {
	WorkCustomEndpoints,
	WorkGetStatsByCompanyInput,
	WorkGetStatsByUserIdInput,
	WorkGetStatsByWorkerAndCompanyInput,
	WorkStatsItem
} from "./Work";

export type {
	WorkOfferCustomEndpoints,
	WorkOfferGetWageStatsInput,
	WorkOfferGetWageStatsResponse,
	WorkOfferWageRange,
	WorkOfferWageStatsOffer
} from "./WorkOffer";

export type {
	TournamentCustomEndpoints,
	TournamentGetLastTournamentResponse,
	TournamentTeamGetByIdInput,
	TournamentTeamGetByTournamentIdInput,
	TournamentTeam,
	TournamentMatch,
	TournamentRound,
	TournamentRegistered
} from "./Tournament";

import type { CompanyCustomEndpoints } from "./Company";
import type { DonationCustomEndpoints } from "./Donation";
import type { ElectionCustomEndpoints } from "./Election";
import type { GameStatCustomEndpoints } from "./GameStat";
import type { MuMemberCustomEndpoints } from "./MuMember";
import type { PartyCustomEndpoints } from "./Party";
import type { TradingOrderCustomEndpoints } from "./TradingOrder";
import type { WorkCustomEndpoints } from "./Work";
import type { WorkOfferCustomEndpoints } from "./WorkOffer";
import type { TournamentCustomEndpoints } from "./Tournament";

export type WarEraCustomEndpoints =
	PartyCustomEndpoints
	& CompanyCustomEndpoints
	& DonationCustomEndpoints
	& ElectionCustomEndpoints
	& GameStatCustomEndpoints
	& MuMemberCustomEndpoints
	& TradingOrderCustomEndpoints
	& WorkCustomEndpoints
	& WorkOfferCustomEndpoints
	& TournamentCustomEndpoints;
