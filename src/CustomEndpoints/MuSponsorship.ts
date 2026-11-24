export type MuSponsorshipGetByCountryInput = {
	countryId: string;
};

export type MuSponsorshipGetActiveByCountryPaginatedInput = {
	countryId: string;
	/** From 1 to 100. */
	limit?: number;
	cursor?: string;
};

export type MuSponsorshipGetForMuInput = {
	muId: string;
};

export type MuSponsorshipGetSponsorableInput = {
	countryId: string;
	/** Up to 50 characters. Without it the server still returns a list. */
	searchText?: string;
};

/** A country's sponsorship of a military unit, offered through a law. */
export type MuSponsorship = {
	_id: string;
	country: string;
	mu: string;
	/** The law that offered it. */
	law: string;
	/**
	 * `"offered"` or `"active"` on 2026-11-24. Every `past` list was empty that day, so the
	 * values of ended sponsorships are unverified.
	 */
	status: string;
	offeredAt: string;
	/** Set on an offer that waits for the MU's answer. */
	offerExpiresAt?: string;
	acceptedAt?: string;
	/** A user id. */
	acceptedBy?: string;
	/** User ids. */
	kickedUsers: string[];
	live: boolean;
	createdAt: string;
	updatedAt: string;
	__v: number;
};

/** The MUs a sponsorship list refers to. */
export type SponsoredMu = {
	name: string;
	membersCount: number;
	hqLevel: number;
};

export type MuSponsorshipGetByCountryResponse = {
	active: MuSponsorship[];
	offered: MuSponsorship[];
	past: MuSponsorship[];
	/** Keyed by MU id. */
	mus: Record<string, SponsoredMu>;
};

export type MuSponsorshipGetActiveByCountryPaginatedResponse = {
	items: MuSponsorship[];
	/** The page's MUs, keyed by MU id. */
	mus: Record<string, SponsoredMu>;
	nextCursor?: string;
};

export type SponsorableMu = {
	_id: string;
	name: string;
	membersCount: number;
};

export type MuSponsorshipCustomEndpoints = {
	/** The country's active, offered and past sponsorships. Answers without an API key. */
	"muSponsorship.getByCountry": {
		input: MuSponsorshipGetByCountryInput;
		output: MuSponsorshipGetByCountryResponse;
	};
	/**
	 * Active sponsorships, oldest `acceptedAt` first, so `cursorEnd` does not fit this list.
	 * Answers without an API key.
	 */
	"muSponsorship.getActiveByCountryPaginated": {
		input: MuSponsorshipGetActiveByCountryPaginatedInput;
		output: MuSponsorshipGetActiveByCountryPaginatedResponse;
	};
	/** The MU's offered or active sponsorship, or `null`. Answers without an API key. */
	"muSponsorship.getForMu": {
		input: MuSponsorshipGetForMuInput;
		output: MuSponsorship | null;
	};
	/** MUs the country could sponsor, by name. Answers without an API key. */
	"muSponsorship.getSponsorable": {
		input: MuSponsorshipGetSponsorableInput;
		output: SponsorableMu[];
	};
};
