import type { ArticleGetArticleByIdResponse } from "../api/Responses";

export type ArticleGetWelcomeArticleByCountryIdInput = { countryId: string };
export type WelcomeArticle = Omit<ArticleGetArticleByIdResponse, "isPublic" | "slug"> & {
	welcomeArticleOfCountry?: string;
	isPublic?: boolean;
	slug?: string;
};
export type ArticleGetWelcomeArticleByCountryIdResponse = WelcomeArticle | null;
export type ArticleCustomEndpoints = {
	"article.getWelcomeArticleByCountryId": {
		input: ArticleGetWelcomeArticleByCountryIdInput;
		output: ArticleGetWelcomeArticleByCountryIdResponse;
	};
};
