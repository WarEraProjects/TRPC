export type ElectionType =
	| "president"
	| "congress"
	| "partyPrimary"
	| "partyLeader"
	| "partyCouncil";

/** The server requires `countryId` or `partyId` (both may be given). */
export type ElectionGetElectionsInput = (
	| { countryId: string; partyId?: string }
	| { partyId: string; countryId?: string }
) & {
	limit?: number;
	cursor?: string;
	direction?: "forward" | "backward";
};

export type ElectionCandidate = {
	user: string;
	voteCount: number;
	article?: string;
	party?: string;
	isElected?: boolean;
};

export type ElectionListItem = {
	_id: string;
	country: string;
	electedCandidates: string[];
	isActive: boolean;
	type: ElectionType | (string & {});
	candidates: ElectionCandidate[];
	votesStartAt: string;
	votesEndAt: string;
	votesCount: number;
	electedCount: number;
	createdAt: string;
	status: string;
	votes: Record<string, number>;
	__v: number;
};

export type ElectionGetElectionsResponse = {
	items: ElectionListItem[];
	nextCursor?: string;
};

export type ElectionGetElectionInput = { electionId: string };
export type ElectionGetElectionResponse = ElectionListItem;

export type ElectionCustomEndpoints = {
	"election.getElection": { input: ElectionGetElectionInput; output: ElectionGetElectionResponse };
	"election.getElections": {
		input: ElectionGetElectionsInput;
		output: ElectionGetElectionsResponse;
	};
};
