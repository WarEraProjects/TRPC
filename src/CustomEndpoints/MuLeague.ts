import type { LeagueReward } from "./League";

export type MuLeagueGetMuLeagueInput = {
	muId: string;
};

export type MuLeagueDivisionCounts = {
	/** Year and ISO week, such as `"2026-48"`. */
	yearWeek: string;
	/** MUs per division: 16 counts on 2026-11-24, the largest first. */
	mus: number[];
};

/** Where an MU is headed at the end of the week. */
export type MuLeagueMove = "up" | "stay" | "down";

/** An MU's weekly league group. */
export type MuLeagueGroup = {
	_id: string;
	groupIndex: number;
	groupsCount: number;
	strengthAvg: number;
	membersCount: number;
	promoteCount: number;
	demoteCount: number;
};

export type MuLeagueRow = {
	mu: string;
	rank: number;
	points: number;
	seats: number;
	isEligible: boolean;
	/** `null` for a place without a reward. */
	pot: LeagueReward | null;
	division: number;
	move: MuLeagueMove;
};

/** One player's part of the MU's points and reward. */
export type MuLeagueShare = {
	user: string;
	points: number;
	/** Between 0 and 1. */
	share: number;
	isMember: boolean;
	/** Absent for 7 of 118 shares on 2026-11-24. */
	reward?: {
		money: number;
		items?: { case1: number; case2?: number };
	};
};

export type MuLeagueGetMuLeagueResponse = {
	yearWeek: string;
	weekEndsAt: string;
	/** Absent, with `me`, when the MU is in no league this week, as for an unknown id. */
	league?: MuLeagueGroup;
	me?: {
		rank: number;
		points: number;
		division: number;
		multiplier: number;
		move: MuLeagueMove;
	};
	/** Best first. */
	rows: MuLeagueRow[];
	shares: MuLeagueShare[];
	/** Pot per final place, first place first; `null` for a place without one. */
	placePots: (LeagueReward | null)[];
};

export type MuLeagueCustomEndpoints = {
	/** Answers without an API key. */
	"muLeague.getDivisionCounts": { output: MuLeagueDivisionCounts };
	/** The MU's weekly league group. Answers without an API key. */
	"muLeague.getMuLeague": {
		input: MuLeagueGetMuLeagueInput;
		output: MuLeagueGetMuLeagueResponse;
	};
};
