import { integrationTest, assert, isObject, client, countryId } from "./helpers/context";

integrationTest("article.getWelcomeArticleByCountryId", async () => {
  const value = await client.article.getWelcomeArticleByCountryId({ countryId });

			assert(value === null || isObject(value), "expected null or an article object");
			if (value) {
				assert(typeof value._id === "string", "expected string _id");
				assert(typeof value.title === "string", "expected string title");
				assert(typeof value.welcomeArticleOfCountry === "string", "expected welcomeArticleOfCountry");
			}
});
