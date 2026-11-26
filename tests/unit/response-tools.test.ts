import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { EndpointRunner } from "../../Responses/all-endpoints/runner";
import { runFallbackWorkflow } from "../../Responses/all-endpoints/workflows/fallback";
import { generateResponseTypes } from "../../Responses/ConvertToTypes";

/** A scratch copy of the crawler's folders: outputs, backups and a stand-in for src/api/Responses.d.ts. */
async function scratchFolders(outputs: Record<string, unknown>, backup: Record<string, unknown> = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "warera-response-tools-"));
  const outputsRoot = path.join(root, "outputs");
  const outputBackupsRoot = path.join(root, "outputs-backups");
  const folders: [string, Record<string, unknown>][] = [
    [outputsRoot, outputs],
    [path.join(outputBackupsRoot, "outputs-2026-11-24T00-00-00-000Z"), backup],
  ];
  for (const [folder, samples] of folders) {
    for (const [operationKey, payload] of Object.entries(samples)) {
      const [group, name] = operationKey.split(".");
      await fs.mkdir(path.join(folder, group), { recursive: true });
      await fs.writeFile(path.join(folder, group, `${name}.json`), JSON.stringify(payload), "utf8");
    }
  }
  const srcFile = path.join(root, "src-Responses.d.ts");
  await fs.writeFile(srcFile, "// hand-corrected\n", "utf8");
  return {
    paths: { outputsRoot, outputBackupsRoot, srcFile },
    draftFile: path.join(outputsRoot, "Responses.d.ts"),
    srcFile,
    remove: () => fs.rm(root, { recursive: true, force: true }),
  };
}

test("convertToTypes writes a draft and leaves the hand-corrected src types alone", async () => {
  const scratch = await scratchFolders({ "gameConfig.getDates": { serverTime: "2026-11-25T00:00:00.000Z" } });
  try {
    const count = await generateResponseTypes({ paths: scratch.paths });

    assert.equal(count, 1);
    assert.match(await fs.readFile(scratch.draftFile, "utf8"), /export type GameConfigGetDatesResponse = \{/);
    assert.equal(await fs.readFile(scratch.srcFile, "utf8"), "// hand-corrected\n");
  } finally {
    await scratch.remove();
  }
});

test("convertToTypes replaces the src types only when asked to", async () => {
  const scratch = await scratchFolders({ "gameConfig.getDates": { serverTime: "2026-11-25T00:00:00.000Z" } });
  try {
    await generateResponseTypes({ paths: scratch.paths, writeSrc: true });

    assert.equal(await fs.readFile(scratch.srcFile, "utf8"), await fs.readFile(scratch.draftFile, "utf8"));
  } finally {
    await scratch.remove();
  }
});

test("convertToTypes reads region.getById as one sample per region, not as a list response", async () => {
  // The crawler saves the response of every region in one file, so that fields only some regions
  // have come out optional.
  const scratch = await scratchFolders({
    "region.getById": [
      { _id: "region-1", name: "One", activeBattle: "battle-1" },
      { _id: "region-2", name: "Two" },
    ],
  });
  try {
    await generateResponseTypes({ paths: scratch.paths, ignoreTypeNaming: true });

    const draft = await fs.readFile(scratch.draftFile, "utf8");
    assert.match(draft, /export type RegionGetByIdResponse = A1;/);
    assert.match(draft, /export interface A1 \{\n {2}_id: string;\n {2}activeBattle\?: string;\n {2}name: string;\n\}/);
  } finally {
    await scratch.remove();
  }
});

test("convertToTypes falls back to the backups of an empty region.getById sample file", async () => {
  const scratch = await scratchFolders(
    { "region.getById": [] },
    { "region.getById": [{ _id: "region-1", name: "One" }] }
  );
  try {
    await generateResponseTypes({ paths: scratch.paths, ignoreTypeNaming: true });

    const draft = await fs.readFile(scratch.draftFile, "utf8");
    assert.match(draft, /export type RegionGetByIdResponse = A1;/);
    assert.match(draft, /export interface A1 \{\n {2}_id: string;\n {2}name: string;\n\}/);
  } finally {
    await scratch.remove();
  }
});

test("the crawler's fallback treats an empty WARERA_*_ID variable as not set", async () => {
  // A copy of .env-example leaves WARERA_ROUND_ID and WARERA_COMPANY_ID set to an empty string.
  const names = [
    "WARERA_ROUND_ID",
    "WARERA_COMPANY_ID",
    "WARERA_BATTLE_LOOT_BATTLE_ID",
    "WARERA_BATTLE_LOOT_USER_ID",
  ] as const;

  const inputs = new Map<string, Record<string, unknown> | undefined>();
  const runner = new EndpointRunner(os.tmpdir(), os.tmpdir(), 10);
  runner.responses["company.getCompanies"] = { items: ["company-1"] };
  runner.loadOrFetch = async () => null;
  runner.loadOrFetchByOperation = async (operationKey, input) => {
    inputs.set(operationKey, input);
    return null;
  };

  const before = names.map((name) => process.env[name]);
  try {
    for (const name of names) process.env[name] = "";

    await runFallbackWorkflow(runner, {
      countryId: "country-1",
      userId: "user-1",
      regionId: "region-1",
      battleId: "battle-1",
      roundId: "round-1",
      articleId: "article-1",
      muId: "mu-1",
    });

    assert.deepEqual(inputs.get("round.getById"), { roundId: "round-1" });
    assert.deepEqual(inputs.get("company.getById"), { companyId: "company-1" });
    assert.deepEqual(inputs.get("battleLootSummary.getByBattleAndUser"), { battleId: "battle-1", userId: "user-1" });
  } finally {
    names.forEach((name, index) => {
      if (before[index] === undefined) delete process.env[name];
      else process.env[name] = before[index];
    });
  }
});
