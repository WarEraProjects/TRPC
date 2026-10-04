import { integrationTest, assert, isObject, client, countryId } from "./helpers/context";

integrationTest("countryDiplomacy.getByCountry", async () => {
  const value = await client.countryDiplomacy.getByCountry({ countryId });

			assert(isObject(value), "expected object response");
			assert(Array.isArray(value.defensivePacts), "expected defensivePacts array");
			if (value.swornEnemy) {
				assert(typeof value.swornEnemy.enemy === "string", "expected string swornEnemy.enemy");
				assert(typeof value.swornEnemy.damagesDealt === "number", "expected numeric swornEnemy.damagesDealt");
			}
});
