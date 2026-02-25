import { createTrpcClient } from "../src/trpc-client";

async function main() {
  const client = createTrpcClient({
    apiKey: process.env.WARERA_API_KEY,
    logBatches: (info) => {
      // console.log(info.batchSize, info.paths, info.method, info.body);
      // console.log(info.url);
    },
    rateLimit: 500
  });
  
  // Intensly test the performance:
  // Get all countries
  // Get all users for each country
  // Get all companies for each user.

  const allCountries = await client.country.getAllCountries();
  console.log(`Fetched ${allCountries.length} countries\n`);

  let totalUsers = 0;
  let totalCompanies = 0;

  const startTime = Date.now();

  await Promise.all(allCountries.map(async (country) => {
    let countryUserCount = 0;
    
    for await (const userPage of client.user.getUsersByCountry({
      countryId: country._id,
      autoPaginate: true
    })) {
      totalUsers += userPage.items.length;
      countryUserCount += userPage.items.length;

      // Queue all company requests at once for batching
      const companyPromises = userPage.items.map(userData =>
        (async () => {
          for await (const companiesPage of client.company.getCompanies({
            userId: userData._id,
            autoPaginate: true
          })) {
            totalCompanies += companiesPage.items.length;
          }
        })()
      );

      // Wait for all company requests to complete
      await Promise.all(companyPromises);
    }
    
    console.log(`${country.name}: ${countryUserCount} users`);
  }));

  const elapsedTime = Date.now() - startTime;

  console.log(`\n✅ Complete:`);
  console.log(`  - Countries: ${allCountries.length}`);
  console.log(`  - Total Users: ${totalUsers}`);
  console.log(`  - Total Companies: ${totalCompanies}`);
  console.log(`  - Elapsed Time: ${(elapsedTime / 1000).toFixed(2)}s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
