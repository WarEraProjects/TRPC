export type SearchSearchMusInput = { searchText: string };
export type SearchSearchUsersInput = { searchText: string };
/** Search returns entity IDs, rather than populated entity objects. */
export type SearchCustomEndpoints = {
	"search.searchMus": { input: SearchSearchMusInput; output: string[] };
	"search.searchUsers": { input: SearchSearchUsersInput; output: string[] };
};
