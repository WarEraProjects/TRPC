export type TournamentMatch = {
	attacker: string;
	defender: string;
	isQualificationRound: boolean;
	battle: string;
};

export type TournamentRound = {
	roundNumber: number;
	cases: number;
	skillValue: number | null;
	isQualificationRound: boolean;
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
	startAt: string;
	teamSize: number;
	teamCount: number;
	roundsCount: number;
	type: string;
	maxRarity: string;
	skillKey: string;
	autoQualify1stRound: string[];
	registered: TournamentRegistered;
	activeRound: number;
	rounds: Record<string, TournamentRound>;
	createdAt: string;
	updatedAt: string;
	__v: number;
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
	createdAt: string;
	updatedAt: string;
	__v: number;
};

export type TournamentCustomEndpoints = {
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
