export type GovernmentGetCongressSeatsInput = {
	countryId: string;
};

/** One seat in a country's congress. */
export type CongressSeat = {
	/** A user id. */
	user: string;
	/** A party id; 8 of 58 seats had none on 2026-11-10. */
	party?: string;
	/** `false` on all 58 seats checked on 2026-11-10. */
	hasLeftParty: boolean;
};

export type GovernmentCustomEndpoints = {
	/**
	 * The country's congress: 1 to 5 seats in each of the 14 countries checked on 2026-11-10. An
	 * unknown country id fails with `NOT_FOUND`. Answers without an API key.
	 */
	"government.getCongressSeats": {
		input: GovernmentGetCongressSeatsInput;
		output: CongressSeat[];
	};
};
