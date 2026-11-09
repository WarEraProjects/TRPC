export type ArticleInteractionInput = {
	articleId: string;
};

/** One like, dislike, tip or gem tip on an article: who, and when. */
export type ArticleInteraction = {
	userId: string;
	createdAt: string;
};

/**
 * Each procedure answers without an API key with the whole list, newest first. The server ignores
 * `limit` and `cursor`: on 2026-11-09 an article with 62 likes returned all 62 with both set.
 * Every dislikers list checked that day was empty, so its rows are assumed to match the others.
 */
export type ArticleInteractionCustomEndpoints = {
	"articleInteraction.getArticleLikers": {
		input: ArticleInteractionInput;
		output: ArticleInteraction[];
	};
	"articleInteraction.getArticleDislikers": {
		input: ArticleInteractionInput;
		output: ArticleInteraction[];
	};
	"articleInteraction.getArticleTippers": {
		input: ArticleInteractionInput;
		output: ArticleInteraction[];
	};
	"articleInteraction.getArticleGemTippers": {
		input: ArticleInteractionInput;
		output: ArticleInteraction[];
	};
};
