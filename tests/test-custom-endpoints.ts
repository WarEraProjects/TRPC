import fs from "node:fs";
import path from "node:path";
import { createAPIClient } from "../src/index";

const root = process.cwd();
const countryId = process.env.WARERA_COUNTRY_ID ?? "6813b6d446e731854c7ac7a0";

type JsonRecord = Record<string, any>;

type EndpointTest = {
	name: string;
	run: () => Promise<unknown>;
	validate: (value: any) => void;
};

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
	if (!value || Array.isArray(value) || typeof value === "string") return undefined;
	const worker = value?.workers?.[0] ?? value?.items?.[0] ?? (Array.isArray(value) ? value[0] : undefined);
	return worker?._id ?? worker?.user ?? worker?.workerId;
}

const ids = {
	companyId: process.env.WARERA_COMPANY_ID ?? idFromOutput("Responses/outputs/company/getById.json"),
	muId: process.env.WARERA_MU_ID ?? idFromOutput("Responses/outputs/mu/getById.json"),
	userId: process.env.WARERA_USER_ID ?? idFromOutput("Responses/outputs/user/getUserLite.json"),
	workerId: process.env.WARERA_WORKER_ID ?? workerIdFromOutput(),
};

const requiredIds = ["companyId", "muId", "userId", "workerId"] as const;
const missingIds = requiredIds.filter((key) => !ids[key]);
if (missingIds.length > 0) {
	throw new Error(`Missing test IDs: ${missingIds.join(", ")}`);
}
const testIds = ids as Record<(typeof requiredIds)[number], string>;

const client = createAPIClient({
	apiKey: process.env.WARERA_API_KEY,
});

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

const tests: EndpointTest[] = [
	{
		name: "company.getProductionBonus",
		run: () => client.company.getProductionBonus({ companyId: testIds.companyId }),
		validate: (value) => {
			assert(isObject(value), "expected object response");
			console.log("Received production bonus response:", value);
			for (const key of ["strategicBonus", "depositBonus", "ethicSpecializationBonus", "ethicDepositBonus", "total"]) {
				assert(typeof value[key] === "number", `expected numeric ${key}`);
			}
		},
	},
	{
		name: "donation.getManyPaginated",
		run: () => client.donation.getManyPaginated({ muId: testIds.muId, limit: 20, direction: "forward" }),
		validate: (value) => {
			assert(Array.isArray(value.items), "expected items array");
			console.log("Received donations paginated response:", value);
			assert(value.nextCursor === undefined || typeof value.nextCursor === "string", "expected optional string nextCursor");
		},
	},
	{
		name: "donation.getTotalDonations",
		run: () => client.donation.getTotalDonations({ muId: testIds.muId }),
		validate: (value) => {
			assert(typeof value.totalAmount === "number", "expected numeric totalAmount");
			assert(typeof value.donorCount === "number", "expected numeric donorCount");
			console.log("Received total donations response:", value);
		},
	},
	{
		name: "gameStat.getEquipmentAvgByCode",
		run: () => client.gameStat.getEquipmentAvgByCode({ itemCode: "gun" }),
		validate: (value) => {
			assert(typeof value === "number", "expected numeric average");
			console.log("Received equipment average response:", value);
		},
	},
	{
		name: "muMember.getByMu",
		run: () => client.muMember.getByMu({ muId: testIds.muId }),
		validate: (value) => {
			assert(Array.isArray(value), "expected array response");
			console.log("Received MU members response:", value);
		},
	},
	{
		name: "tradingOrder.getPublicOrdersByOwner",
		run: () => client.tradingOrder.getPublicOrdersByOwner({ countryId }),
		validate: (value) => {
			assert(Array.isArray(value.buyOrders), "expected buyOrders array");
			assert(Array.isArray(value.sellOrders), "expected sellOrders array");
			assert(Array.isArray(value.allOrders), "expected allOrders array");
			assert(typeof value.totalBuyMoneyInvested === "number", "expected numeric totalBuyMoneyInvested");
			assert(isObject(value.totalSellQuantities), "expected totalSellQuantities object");
			console.log("Received trading orders response:", value);
		},
	},
	{
		name: "workOffer.getWageStats",
		run: () => client.workOffer.getWageStats({ energy: 90, production: 31, citizenship: countryId }),
		validate: (value) => {
			assert(isObject(value.allowedRange), "expected allowedRange object");
			assert(typeof value.topOffer === "number", "expected numeric topOffer");
			assert(typeof value.topEligibleOffer === "number", "expected numeric topEligibleOffer");
			assert(Array.isArray(value.topEligibleOffers), "expected topEligibleOffers array");
			console.log("Received wage stats response:", value);
		},
	},
	{
		name: "work.getStatsByUserId",
		run: () => client.work.getStatsByUserId({ userId: testIds.userId, days: 7, timezone: "Europe/Amsterdam" }),
		validate: (value) => {
			assert(Array.isArray(value), "expected array response");
			console.log("Received work stats response:", value);
		},
	},
	{
		name: "work.getStatsByCompany",
		run: () => client.work.getStatsByCompany({ companyId: testIds.companyId, days: 7, timezone: "Europe/Amsterdam" }),
		validate: (value) => {
			assert(Array.isArray(value), "expected array response");
			console.log("Received work stats by company response:", value);
		},
	},
	{
		name: "work.getStatsByWorkerAndCompany",
		run: () => client.work.getStatsByWorkerAndCompany({
			workerId: testIds.workerId,
			companyId: testIds.companyId,
			days: 14,
			timezone: "Europe/Amsterdam",
		}),
		validate: (value) => {
			assert(Array.isArray(value), "expected array response");
			console.log("Received work stats by worker and company response:", value);
		},
	},
	{
		name: "upgrade.getUpgradeByTypeAndEntity headquarters",
		run: () => client.upgrade.getUpgradeByTypeAndEntity({ upgradeType: "headquarters", muId: testIds.muId }),
		validate: (value) => {
			assert(isObject(value), "expected object response");
			assert(value.upgradeType === "headquarters", "expected headquarters upgrade");
			assert(value.mu === testIds.muId, "expected MU-scoped upgrade");
			console.log("Received headquarters upgrade response:", value);
		},
	},
	{
		name: "upgrade.getUpgradeByTypeAndEntity dormitories",
		run: () => client.upgrade.getUpgradeByTypeAndEntity({ upgradeType: "dormitories", muId: testIds.muId }),
		validate: (value) => {
			assert(isObject(value), "expected object response");
			assert(value.upgradeType === "dormitories", "expected dormitories upgrade");
			assert(value.mu === testIds.muId, "expected MU-scoped upgrade");
			console.log("Received dormitories upgrade response:", value);
		},
	},
	{
		name: "party.getManyPaginated",
		run: () => client.party.getManyPaginated({ limit: 100, countryId, direction: "forward" }),
		validate: (value) => {
			assert(Array.isArray(value.items), "expected items array");
			console.log("Received parties paginated response:", value);
		},
	},
	{
		name: "party.getById",
		run: async () => client.party.getById({ partyId: await getPartyId() }),
		validate: (value) => {
			assert(isObject(value), "expected object response");
			assert(typeof value._id === "string", "expected string _id");
			console.log("Received party by ID response:", value);
		},
	},
	{
		name: "election.getElections",
		run: () => client.election.getElections({ limit: 100, countryId, direction: "forward" }),
		validate: (value) => {
			assert(Array.isArray(value.items), "expected items array");
			console.log("Received elections response:", value);
		},
	},
	{
		name: "company.getRecommendedRegionIdsByItemCode",
		run: () => client.company.getRecommendedRegionIdsByItemCode({ itemCode: "steel", includeDeposit: true }),
		validate: (value) => {
			assert(Array.isArray(value), "expected array response");
			console.log("Received recommended region IDs response:", value);
		},
	},
	{
		name: "tournament.getLastTournament",
		run: () => client.tournament.getLastTournament(),
		validate: (value) => {
			assert(isObject(value), "expected object response");
			assert(typeof value._id === "string", "expected string _id");
			assert(typeof value.name === "string", "expected string name");
			assert(typeof value.status === "string", "expected string status");
			assert(isObject(value.registered), "expected registered object");
			assert(isObject(value.rounds), "expected rounds object");
			console.log("Received last tournament response:", value);
		},
	},
	{
		name: "tournamentTeam.getByTournamentId",
		run: async () => client.tournamentTeam.getByTournamentId({ tournamentId: await getTournamentId() }),
		validate: (value) => {
			assert(Array.isArray(value), "expected array response");
			if (value.length > 0) {
				assert(typeof value[0]._id === "string", "expected string _id on first team");
				assert(typeof value[0].tournament === "string", "expected string tournament on first team");
			}
			console.log(`Received ${value.length} tournament teams`);
		},
	},
	{
		name: "tournamentTeam.getById",
		run: async () => client.tournamentTeam.getById({ tournamentTeamId: await getTournamentTeamId() }),
		validate: (value) => {
			assert(isObject(value), "expected object response");
			assert(typeof value._id === "string", "expected string _id");
			assert(typeof value.tournament === "string", "expected string tournament");
			assert(Array.isArray(value.participants), "expected participants array");
			console.log("Received tournament team response:", value);
		},
	},
];

const results = [];
for (const test of tests) {
	try {
		const value = await test.run();
		test.validate(value);
		const size = Array.isArray(value) ? value.length : isObject(value) && Array.isArray(value.items) ? value.items.length : "";
		results.push({ name: test.name, ok: true, size });
		console.log(`PASS ${test.name}${size !== "" ? ` (${size})` : ""}`);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		results.push({ name: test.name, ok: false, error: message });
		console.error(`FAIL ${test.name}: ${message}`);
	}
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} endpoint tests passed.`);
if (failed.length > 0) {
	process.exitCode = 1;
}
