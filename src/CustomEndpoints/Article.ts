import type { ArticleGetArticleByIdResponse, ArticleListItem } from "../api/Responses";

export type ArticleGetWelcomeArticleByCountryIdInput = { countryId: string };
export type WelcomeArticle = Omit<ArticleGetArticleByIdResponse, "isPublic" | "slug"> & {
	welcomeArticleOfCountry?: string;
	isPublic?: boolean;
	slug?: string;
};
export type ArticleGetWelcomeArticleByCountryIdResponse = WelcomeArticle | null;

/** An article list item that is pinned until `pinnedUntil`. */
export type PinnedArticle = ArticleListItem & { pinnedUntil: string };

export type ArticleCustomEndpoints = {
	"article.getWelcomeArticleByCountryId": {
		input: ArticleGetWelcomeArticleByCountryIdInput;
		output: ArticleGetWelcomeArticleByCountryIdResponse;
	};
	/** The articles pinned right now: one on 2026-11-10. Answers without an API key. */
	"article.getPinnedArticles": { output: PinnedArticle[] };
};
