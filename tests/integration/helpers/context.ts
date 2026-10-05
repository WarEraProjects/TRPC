import fs from "node:fs";
import path from "node:path";
import { createAPIClient } from "../../../src/index";
import { test } from "node:test";

const root = process.cwd();
const countryId = process.env.WARERA_COUNTRY_ID ?? "6813b6d446e731854c7ac7a0";

type JsonRecord = Record<string, any>;


function readJson(relativePath: string): JsonRecord | string | unknown[] | undefined {
	const fullPath = path.join(root, relativePath);
	if (!fs.existsSync(fullPath)) return undefined;
	return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function idFromOutput(relativePath: string): string | undefined {
	const value = readJson(relativePath);
	if (!value) return undefined;
	if (typeof value === "string") return value;
	if (Array.isArray(value)) return (value[0] as JsonRecord | undefined)?._id;
	if (value._id) return value._id;
	if (value.items?.[0]?._id) return value.items[0]._id;
	return undefined;
}

function workerIdFromOutput(): string | undefined {
	const value = readJson("Responses/outputs/worker/getWorkers.json");
	if (!value || typeof value === "string") return undefined;
	const companyId = process.env.WARERA_COMPANY_ID ?? idFromOutput("Responses/outputs/company/getById.json");
  const group = !Array.isArray(value) && companyId
    ? value.workersPerCompany?.find((entry: JsonRecord) =>
        (typeof entry.company === "string" ? entry.company : entry.company?._id) === companyId)
    : undefined;
  const worker = Array.isArray(value) ? value[0] : group?.workers?.[0] ?? value.workers?.[0] ?? value.items?.[0];
  // work.* procedures key workers by their user id, not by the worker document `_id`.
	return worker?.user ?? worker?.workerId ?? worker?._id;
}

const ids = {
	companyId: process.env.WARERA_COMPANY_ID ?? idFromOutput("Responses/outputs/company/getById.json"),
	muId: process.env.WARERA_MU_ID ?? idFromOutput("Responses/outputs/mu/getById.json"),
	userId: process.env.WARERA_USER_ID ?? idFromOutput("Responses/outputs/user/getUserLite.json"),
	workerId: process.env.WARERA_WORKER_ID ?? workerIdFromOutput(),
};

// Resolve only the IDs needed by the selected test.
function requireId(key: keyof typeof ids): string {
  const id = ids[key];
  assert(id, `Missing ${key}: set the corresponding WARERA_*_ID or collect Responses/outputs fixtures.`);
  return id;
}

const testIds = {
  get companyId() { return requireId("companyId"); },
  get muId() { return requireId("muId"); },
  get userId() { return requireId("userId"); },
  get workerId() { return requireId("workerId"); },
};

const client = createAPIClient({
	apiKey: process.env.WARERA_API_KEY,
  url: process.env.WARERA_API_URL ?? "https://api2.warera.io/trpc",
});

let discoveredUser: Promise<Awaited<ReturnType<typeof client.user.getUserById>>> | undefined;
function getTestUser() {
  return discoveredUser ??= (async () => {
    if (ids.userId) return client.user.getUserById({ userId: ids.userId });
    const username = process.env.WARERA_TEST_USERNAME ?? "Dog";
    const search = await client.search.searchAnything({ searchText: username });
    const users = await Promise.all(search.userIds.map(userId => client.user.getUserById({ userId })));
    const matches = users.filter(user => user.username === username);
    assert(matches.length === 1, `Expected one exact username match for ${JSON.stringify(username)}, found ${matches.length}. Set WARERA_TEST_USERNAME or explicit WARERA_*_ID overrides.`);
    return matches[0];
  })();
}

let discoveredWorkers: Promise<void> | undefined;
async function resolveTestId(key: keyof typeof ids) {
  if (ids[key]) return;
  const user = await getTestUser();
  if (key === "userId") {
    ids.userId = user._id;
  } else if (key === "muId") {
    assert(user.mu, `User ${user.username} has no MU. Set WARERA_MU_ID.`);
    ids.muId = user.mu;
  } else {
    // Resolve the company and worker together so worker-and-company stats use a
    // worker employed at the selected company. Preserve explicitly supplied IDs.
    await (discoveredWorkers ??= (async () => {
      const response = await client.worker.getWorkers({ userId: ids.userId ?? user._id });
      assert(response.type === "user", "expected user-scoped workers response");
      const groups = response.workersPerCompany;
      const candidates = ids.companyId
        ? groups.filter(group => group.company._id === ids.companyId)
        : groups;
      const group = candidates.find(group => group.workers.some(worker => {
        const entry = worker as JsonRecord;
        return typeof entry.user === "string" && (!ids.workerId || entry.user === ids.workerId);
      }));
      if (group) {
        const worker = group.workers.find(worker => {
          const entry = worker as JsonRecord;
          return typeof entry.user === "string" && (!ids.workerId || entry.user === ids.workerId);
        }) as JsonRecord;
        ids.companyId ??= group.company._id;
        ids.workerId ??= worker.user;
      }
      if (!ids.companyId && !ids.workerId) {
        const companies = await client.company.getCompanies({ userId: ids.userId ?? user._id, perPage: 1 });
        ids.companyId = companies.items[0];
      }
    })());
  }
  requireId(key);
}

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

function isObject(value: unknown): value is JsonRecord {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

let cachedPartyId: string | undefined;
async function getPartyId(): Promise<string> {
	if (cachedPartyId) return cachedPartyId;
	const parties = await client.party.getManyPaginated({ limit: 100, countryId, direction: "forward" });
	const partyId = parties.items?.[0]?._id;
	assert(partyId, "expected at least one party to test party.getById");
	cachedPartyId = partyId;
	return cachedPartyId;
}

let cachedTournamentId: string | undefined;
async function getTournamentId(): Promise<string> {
	if (cachedTournamentId) return cachedTournamentId;
	const tournament = await client.tournament.getLastTournament();
	assert(tournament?._id, "expected a tournament to test tournament endpoints");
	cachedTournamentId = tournament._id;
	return cachedTournamentId;
}

let cachedTournamentTeamId: string | undefined;
async function getTournamentTeamId(): Promise<string> {
	if (cachedTournamentTeamId) return cachedTournamentTeamId;
	const teams = await client.tournamentTeam.getByTournamentId({ tournamentId: await getTournamentId() });
	const teamId = teams?.[0]?._id;
	assert(teamId, "expected at least one team for the tournament");
	cachedTournamentTeamId = teamId;
	return cachedTournamentTeamId;
}

let cachedAllianceId: string | undefined;
async function getAllianceId(): Promise<string> {
	if (cachedAllianceId) return cachedAllianceId;
	const alliances = await client.alliance.getManyPaginated({ limit: 100 });
	const allianceId = alliances.items?.[0]?._id;
	assert(allianceId, "expected at least one alliance to test alliance endpoints");
	cachedAllianceId = allianceId;
	return cachedAllianceId;
}


export function integrationTest(name: string, run: () => Promise<void>, requiredIds: (keyof typeof ids)[] = []) {
  test(name, { timeout: 60000 }, async () => {
    assert(process.env.WARERA_API_KEY, "Set WARERA_API_KEY in .env before running live integration tests.");
    for (const key of requiredIds) await resolveTestId(key);
    await run();
  });
}

export { assert, isObject, client, countryId, testIds, getPartyId, getTournamentId, getTournamentTeamId, getAllianceId };
