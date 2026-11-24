import type { RankingType } from "../api/Responses";

export type RankingSnapshotGetEntityRecentRanksInput = {
	/** A user, country, MU or alliance id. */
	entityId: string;
};

export type RankingSnapshotRecentRanks = {
	/** The last 11 days up to today, oldest first, as `YYYY-MM-DD`. Today has no snapshot yet. */
	days: string[];
	/**
	 * One rank per day of `days`, `null` for a day without one. Only rankings of the entity's kind
	 * in which it had a rank on one of these days are present, and none for an unknown id.
	 */
	ranks: Partial<Record<RankingType, (number | null)[]>>;
};

export type RankingHistoryRange = "7d" | "30d" | "90d" | "1y";

export type RankingSnapshotGetHistoryInput = {
	entityId: string;
	rankingType: RankingType;
	range: RankingHistoryRange;
};

/** The entity's place in one daily snapshot. */
export type RankingSnapshotDay = {
	/** `YYYY-MM-DD`. */
	day: string;
	rank: number;
	value: number;
	/** Entries in the ranking that day. */
	count: number;
};

export type RankingSnapshotGetPreviousRanksInput = {
	rankingType: RankingType;
	/** From 1 to 100 ids. */
	entityIds: string[];
};

export type RankingSnapshotCustomEndpoints = {
	/** Ranks in every ranking over the last 11 days. Answers without an API key. */
	"rankingSnapshot.getEntityRecentRanks": {
		input: RankingSnapshotGetEntityRecentRanksInput;
		output: RankingSnapshotRecentRanks;
	};
	/**
	 * Daily snapshots, oldest first, up to the day before. The snapshots began on 2026-11-16: on
	 * 2026-11-24 `"7d"` returned 7 days and the longer ranges the same 8. Answers without an API key.
	 */
	"rankingSnapshot.getHistory": {
		input: RankingSnapshotGetHistoryInput;
		output: RankingSnapshotDay[];
	};
	/**
	 * Each entity's rank in the latest daily snapshot, the last day of `getHistory`, keyed by
	 * entity id. An id without one is left out. Answers without an API key.
	 */
	"rankingSnapshot.getPreviousRanks": {
		input: RankingSnapshotGetPreviousRanksInput;
		output: Record<string, number>;
	};
};
