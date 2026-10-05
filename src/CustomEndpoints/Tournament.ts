export type TournamentMatch = {
	/** Absent on tournaments created before the bracket rework. */
	matchIndex?: number;
	attacker: string;
	defender: string;
	/** Only set on qualification-round matches. */
	isQualificationRound?: boolean;
	possibleAttackerTeamIds?: string[];
	possibleDefenderTeamIds?: string[];
	battle: string;
	/** Set once the match's battle has ended. */
	wonBy?: "attacker" | "defender";
	/** Match indexes of the previous-round matches feeding each side. */
	predecessors?: Partial<Record<"attacker" | "defender", number>>;
};

export type TournamentRound = {
	roundNumber: number;
	cases: number;
	skillValue?: number | null;
	/** Only set on the qualification round. */
	isQualificationRound?: boolean;
	matches: TournamentMatch[];
};

export interface TournamentRegistered {
	countries: string[];
	mus: string[];
	users: string[];
}

export type TournamentGetLastTournamentResponse = {
	_id: string;
	name: string;
	description?: string;
	isActive: boolean;
	status: string;
	/** Absent on some older tournaments. */
	startAt?: string;
	teamSize: number;
	teamCount: number;
	roundsCount: number;
	type: string;
	/** Absent on some older tournaments. */
	maxRarity?: string;
	skillKey: string;
	autoQualify1stRound: string[];
	registered: TournamentRegistered;
	activeRound: number;
	rounds: Record<string, TournamentRound>;
	createdAt: string;
	updatedAt: string;
	__v: number;
	winnerTournamentTeam?: string;
};

export type TournamentTeamGetByIdInput = {
	tournamentTeamId: string;
};

export type TournamentTeamGetByTournamentIdInput = {
	tournamentId: string;
};

export type TournamentTeam = {
	_id: string;
	tournament: string;
	number: number;
	countries: string[];
	mus: string[];
	users: string[];
	participants: string[];
	colorScheme: string;
	estimatedUsers: number;
	status: string;
	totalDamage: number;
	/** Damage dealt per participating entity id (country, MU or user). */
	damageByEntity: Record<string, number>;
	createdAt: string;
	updatedAt: string;
	__v: number;
};

export type TournamentGetByIdInput = { tournamentId: string };
export type TournamentGetManyPaginatedInput = { limit?: number; cursor?: string };
export type TournamentGetManyPaginatedResponse = { items: TournamentGetLastTournamentResponse[]; nextCursor?: string | null };

export type TournamentCustomEndpoints = {
	"tournament.getById": { input: TournamentGetByIdInput; output: TournamentGetLastTournamentResponse };
	"tournament.getManyPaginated": { input: TournamentGetManyPaginatedInput; output: TournamentGetManyPaginatedResponse };
	"tournament.getLastTournament": {
		output: TournamentGetLastTournamentResponse;
	};
	"tournamentTeam.getById": {
		input: TournamentTeamGetByIdInput;
		output: TournamentTeam;
	};
	"tournamentTeam.getByTournamentId": {
		input: TournamentTeamGetByTournamentIdInput;
		output: TournamentTeam[];
	};
};
