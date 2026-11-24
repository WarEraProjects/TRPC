export type BattleRankingGetPrivateMercenaryDamageInput = {
	battleId: string;
	/** Sums one round only. */
	roundId?: string;
};

/** Damage per side. */
export type PrivateMercenaryDamage = {
	attacker: number;
	defender: number;
};

export type BattleRankingCustomEndpoints = {
	/**
	 * The damage the game labels private mercenary damage, per side. The game shows it as one extra
	 * row in a battle's country and alliance damage rankings. An unknown battle or round id gives
	 * `0` on both sides. Answers without an API key.
	 */
	"battleRanking.getPrivateMercenaryDamage": {
		input: BattleRankingGetPrivateMercenaryDamageInput;
		output: PrivateMercenaryDamage;
	};
};
