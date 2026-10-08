// Developer playground for trying API calls manually. This script is run on its
// own and is not included in the automated unit or integration test suites.
// Run with: npm run playground
// If your API key is exported in ~/.bashrc, use:
// bash -ic 'npm run playground'

// Load variables from the project's .env file. Existing exported shell variables
// take precedence, so either configuration method can supply the API key.
import "dotenv/config";

// Import the local source client so experiments use your current code changes.
import { createAPIClient } from "../src/index";

// Create a reusable client with the configured API key and optional server URL.
// When WARERA_API_URL is absent, requests go to the default WarEra API server.
const client = createAPIClient({
  apiKey: process.env.WARERA_API_KEY,
  url: process.env.WARERA_API_URL ?? "https://api2.warera.io/trpc",
});

// Keep experiments in this async function so API calls can be awaited in order.
async function main() {
  // Fetch all regions, then print their complete nested data for inspection.
  const regions = await client.region.getAll();
  console.dir(regions, { depth: null });

  // Add your own API calls here.
}

// Start the playground and report failures. A nonzero exit code lets the shell
// or other tooling detect that the script failed.
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
