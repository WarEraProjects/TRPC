import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateResponseTypes, responseTypesDraftFile, responseTypesSrcFile } from "../ConvertToTypes";
import { SAMPLE_SIZE } from "./config";
import { EndpointRunner } from "./runner";
import type { CollectedIds } from "./types";
import { runArticleWorkflow } from "./workflows/article";
import { runBattleWorkflow } from "./workflows/battle";
import { runCompanyWorkflow } from "./workflows/company";
import { runFallbackWorkflow } from "./workflows/fallback";
import { runOffersAndMuWorkflow } from "./workflows/offers-and-mu";
import { runRegionWorkflow } from "./workflows/region";
import { runUserWorkflow } from "./workflows/user";
import { runWarmup } from "./workflows/warmup";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testsRoot = path.resolve(__dirname, "..");

const outputsRoot = path.join(testsRoot, "outputs");
const outputBackupsRoot = path.join(testsRoot, "outputs-backups");

const cliArgs = new Set(process.argv.slice(2));
const shouldRefreshOutputs =
  cliArgs.has("--refresh-outputs") ||
  cliArgs.has("--fresh") ||
  cliArgs.has("--rebuild-outputs");

export async function runAllEndpoints(): Promise<void> {
  const runner = new EndpointRunner(outputsRoot, outputBackupsRoot, SAMPLE_SIZE);

  if (shouldRefreshOutputs) {
    const backupPath = await runner.backupAndResetOutputs();
    if (backupPath) {
      console.log(`Backed up outputs to: ${backupPath}`);
    }
    console.log("Cleared outputs cache. Re-fetching all endpoints...");
  }

  const ids: CollectedIds = {};
  process.stdout.write("Running Warmup...");
  await runWarmup(runner);
  process.stdout.write("\rRunning Warmup... Completed.\n");
  process.stdout.write("Running User workflow...");
  await runUserWorkflow(runner, ids);
  process.stdout.write("\rRunning User workflow... Completed.\n");
  process.stdout.write("Running Region workflow...");
  await runRegionWorkflow(runner, ids);
  process.stdout.write("\rRunning Region workflow... Completed.\n");
  process.stdout.write("Running Company workflow...");
  await runCompanyWorkflow(runner, ids);
  process.stdout.write("\rRunning Company workflow... Completed.\n");
  process.stdout.write("Running Battle workflow...");
  await runBattleWorkflow(runner, ids);
  process.stdout.write("\rRunning Battle workflow... Completed.\n");
  process.stdout.write("Running Offers and MU workflow...");
  await runOffersAndMuWorkflow(runner, ids);
  process.stdout.write("\rRunning Offers and MU workflow... Completed.\n");
  process.stdout.write("Running Article workflow...");
  await runArticleWorkflow(runner, ids);
  process.stdout.write("\rRunning Article workflow... Completed.\n");
  process.stdout.write("Running Fallback workflows...");
  await runFallbackWorkflow(runner, ids);
  process.stdout.write("\rRunning Fallback workflows... Completed.\n");
  

  if (shouldRefreshOutputs) {
    // src/api/Responses.d.ts is corrected by hand, so it is replaced only on request.
    const writeSrc = cliArgs.has("--write-src");
    await generateResponseTypes({ writeSrc });
    console.log(
      writeSrc
        ? `Refreshed ${responseTypesDraftFile} and ${responseTypesSrcFile} from newly fetched outputs.`
        : `Refreshed ${responseTypesDraftFile} from newly fetched outputs. ${responseTypesSrcFile} was left as it is; --write-src replaces it.`
    );
  }
}
