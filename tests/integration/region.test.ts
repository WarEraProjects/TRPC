import { integrationTest, assert, isObject, client } from "./helpers/context";

integrationTest("region.getAll", async () => {
  const value = await client.region.getAll();

			assert(Array.isArray(value), "expected array response");
			assert(value.length > 0, "expected at least one region");
			const region = value[0];
			assert(typeof region._id === "string", "expected string _id");
			assert(typeof region.code === "string", "expected string code");
			assert(typeof region.currentPopulation === "number", "expected numeric currentPopulation");
			assert(typeof region.population === "number", "expected numeric population");
			assert(typeof region.residents === "number", "expected numeric residents");
			assert(isObject(region.upgradesV2), "expected upgradesV2 object");
			const contested = value.find((entry) => entry.activeBattle);
			if (contested) {
				assert(isObject(contested.activeBattle), "expected activeBattle to be a populated battle object");
				assert(typeof contested.activeBattle.war === "string", "expected string war on activeBattle");
			}
});
