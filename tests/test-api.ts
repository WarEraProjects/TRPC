import { createTrpcLikeClient } from "../src/trpc-proxy-client";

async function main() {
  const trpc = createTrpcLikeClient({
    url: "https://api2.warera.io/trpc",
    apiKey: process.env.WARERA_API_KEY
  });

  // Test: run multiple requests concurrently
  const [countryById, allCountries] = await Promise.all([
    trpc.country.getCountryById({ countryId: "683ddd2c24b5a2e114af1612" }),
    trpc.country.getAllCountries({})
  ]);

  console.log("Country details:", countryById);
  console.log("All countries:", allCountries);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
