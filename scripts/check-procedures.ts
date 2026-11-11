/**
 * Checks every procedure the SDK types against the live API.
 *
 *   npm run check:procedures
 *
 * Each procedure is called once with `{}` (or no input for void-input procedures);
 * the calls go out as batches of 50, so a full run costs one request of the rate limit
 * per 50 procedures. The batches are GET requests: the API also accepts POST for queries,
 * so a POST to a name given with `--also` could run a mutation, and tRPC refuses a
 * mutation over GET.
 * The answer tells whether the procedure still exists and whether an API key is
 * enough to use it. A procedure that now wants a player session is no longer usable
 * under the WarEra Terms (section 9.6), see "Terms of use" in the README.
 *
 * The script also compares the SDK with the paths in the API's openapi.json.
 * `--also a.b,c.d` probes further procedures the same way, for example candidates
 * from your own list, without counting them as SDK findings.
 *
 * It exits with 1 when a procedure is gone, needs a session, or the documented
 * set differs from the SDK, so it can run on a schedule.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { VOID_INPUT_PROCEDURES } from "../src/trpc-client";

const root = path.resolve(import.meta.dirname, "..");
const apiUrl = process.env.WARERA_API_URL ?? "https://api2.warera.io/trpc";
const openApiUrl = new URL("/openapi.json", apiUrl).toString();
const apiKey = process.env.WARERA_API_KEY;
const BATCH = 50;

type Status = "ok" | "input rejected" | "premium" | "needs key" | "needs session" | "gone" | "other";

function documentedInSdk(): string[] {
  const source = fs.readFileSync(path.join(root, "src/api/warera-openapi.d.ts"), "utf8");
  return [...source.matchAll(/^ {4}"\/([\w]+\.[\w]+)": \{/gm)].map((match) => match[1]);
}

function customInSdk(): string[] {
  const dir = path.join(root, "src/CustomEndpoints");
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith(".ts") && file !== "index.ts")
    .flatMap((file) => [...fs.readFileSync(path.join(dir, file), "utf8").matchAll(/(?:^\t|\{ )"([\w]+\.[\w]+)": \{/gm)])
    .map((match) => match[1]);
}

function classify(item: any): { status: Status; detail: string } {
  if (item && "result" in item) return { status: "ok", detail: "" };
  const code: string = item?.error?.json?.data?.code ?? item?.error?.data?.code ?? "?";
  const message: string = item?.error?.json?.message ?? item?.error?.message ?? "";
  const short = message.split("\n")[0].slice(0, 60);
  if (code === "NOT_FOUND" && message.startsWith("No procedure found")) return { status: "gone", detail: short };
  if (code === "BAD_REQUEST") return { status: "input rejected", detail: "exists, {} is not a valid input" };
  if (code === "FORBIDDEN" && message === "Premium required") return { status: "premium", detail: short };
  if (code === "FORBIDDEN" && message === "API tokens cannot access this endpoint") return { status: "needs session", detail: short };
  if (code === "UNAUTHORIZED") {
    return message === "API token required" && !apiKey
      ? { status: "needs key", detail: short }
      : { status: "needs session", detail: short };
  }
  // The procedure answered, so it exists; `{}` just made it fail in another way.
  return { status: "other", detail: `exists, ${code} ${short}` };
}

async function probe(procedures: string[]) {
  const results = new Map<string, { status: Status; detail: string }>();
  for (let start = 0; start < procedures.length; start += BATCH) {
    const chunk = procedures.slice(start, start + BATCH);
    const input = Object.fromEntries(
      chunk.map((name, index) => [index, VOID_INPUT_PROCEDURES.has(name) ? undefined : {}])
    );
    const url = `${apiUrl}/${chunk.join(",")}?batch=1&input=${encodeURIComponent(JSON.stringify(input))}`;
    const headers: Record<string, string> = apiKey ? { "x-api-key": apiKey } : {};
    const response = await fetch(url, { headers });
    const items = await response.json();
    if (!Array.isArray(items) || items.length !== chunk.length) {
      throw new Error(`Unexpected answer (HTTP ${response.status}): ${JSON.stringify(items).slice(0, 200)}`);
    }
    chunk.forEach((name, index) => results.set(name, classify(items[index])));
  }
  return results;
}

async function main() {
  const documented = documentedInSdk();
  const custom = customInSdk();
  const procedures = [...new Set([...documented, ...custom])].sort();

  const openApi = await (await fetch(openApiUrl)).json() as { paths: Record<string, unknown> };
  const live = Object.keys(openApi.paths).map((key) => key.replace(/^\//, ""));
  const newlyDocumented = live.filter((name) => !documented.includes(name));
  const noLongerDocumented = documented.filter((name) => !live.includes(name));

  const alsoIndex = process.argv.indexOf("--also");
  const also = alsoIndex === -1 ? [] : (process.argv[alsoIndex + 1] ?? "").split(",").filter((name) => name && !procedures.includes(name));

  const results = await probe([...procedures, ...also]);
  const width = Math.max(...procedures.map((name) => name.length));
  console.log(`${procedures.length} procedures (${documented.length} documented, ${custom.length} custom), ${apiKey ? "with" : "without"} API key\n`);
  for (const name of procedures) {
    const { status, detail } = results.get(name)!;
    if (status !== "ok" && status !== "input rejected") console.log(`  ${name.padEnd(width)}  ${status.padEnd(14)}  ${detail}`);
  }
  const counts = new Map<Status, number>();
  for (const name of procedures) {
    const { status } = results.get(name)!;
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  console.log(`\n${[...counts].map(([status, count]) => `${status}: ${count}`).join(", ")}`);

  if (also.length) {
    console.log("\nNot in the SDK:");
    for (const name of also) {
      const { status, detail } = results.get(name)!;
      console.log(`  ${name.padEnd(width)}  ${status.padEnd(14)}  ${detail}`);
    }
  }
  if (newlyDocumented.length) console.log(`\nIn openapi.json but not in the SDK (run npm run openapi):\n  ${newlyDocumented.join("\n  ")}`);
  if (noLongerDocumented.length) console.log(`\nIn the SDK's OpenAPI types but no longer in openapi.json:\n  ${noLongerDocumented.join("\n  ")}`);

  const problems = (counts.get("gone") ?? 0) + (counts.get("needs session") ?? 0)
    + newlyDocumented.length + noLongerDocumented.length;
  if (problems) {
    console.log(`\n${problems} finding(s) need a look.`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 2;
});
