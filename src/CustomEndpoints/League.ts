export type LeagueGetUserLeagueInput = {
	userId: string;
};

/** The reward for one final place of a weekly league. */
export type LeagueReward = {
	money: number;
	case1: number;
	case2: number;
	hasBadge: boolean;
};

/** A player's weekly league group. */
export type LeagueGroup = {
	_id: string;
	/** `"regular"` for all 7 users checked on 2026-11-24. */
	kind: string;
	groupIndex: number;
	membersCount: number;
	ratingAvg: number;
	levelAvg: number;
	multiplier: number;
};

export type LeagueRow = {
	user: string;
	rank: number;
	points: number;
	isEligible: boolean;
};

export type LeagueGetUserLeagueResponse = {
	/** Year and ISO week, such as `"2026-48"`. */
	yearWeek: string;
	weekEndsAt: string;
	/** Absent, with `me`, when the user is in no league this week, as for an unknown id. */
	league?: LeagueGroup;
	me?: { points: number; rank: number };
	/** Best first. */
	rows: LeagueRow[];
	/** Reward per final place, first place first; `null` for a place without one. */
	placeRewards: (LeagueReward | null)[];
};

export type LeagueCustomEndpoints = {
	/** The user's weekly league: 10 players a group on 2026-11-24. Answers without an API key. */
	"league.getUserLeague": {
		input: LeagueGetUserLeagueInput;
		output: LeagueGetUserLeagueResponse;
	};
};
