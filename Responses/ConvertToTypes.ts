import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildInterfaceName, buildTypeName, interfaceNameMap } from "./CleanupTypes";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
type InferenceMode = "root" | "nested";

type InterfaceProperty = {
	name: string;
	optional: boolean;
	type: string;
};

type InterfaceEntry = {
	id: string;
	signature: string;
	properties: InterfaceProperty[];
};

type GenerationOptions = {
	ignoreTypeNaming: boolean;
};

type GenerationContext = {
	nextInterfaceIndex: number;
	interfacesBySignature: Map<string, InterfaceEntry>;
	interfaceOrder: InterfaceEntry[];
	options: GenerationOptions;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputsRoot = path.join(__dirname, "outputs");
const outputBackupsRoot = path.join(__dirname, "outputs-backups");
const repoRoot = path.resolve(outputsRoot, "..", "..");
const outputFile = path.join(outputsRoot, "Responses.d.ts");
const srcOutputFile = path.join(repoRoot, "src", "api", "Responses.d.ts");
const ignoredFiles = new Set([
	path.join(outputsRoot, "convert_to_types.ts"),
	path.join(outputsRoot, "Responses.d.ts")
]);

type OutputEntry = {
	operationKey: string;
	typeName: string;
	typeBody: string;
};

const operationSeeds: Record<string, JsonValue> = {
	"battleRanking.getRanking": {
		rankings: [
			{
				country: "",
				value: 0,
				rank: 0,
				_id: ""
			}
		]
	}
};

const operationTypeOverrides: Record<string, string> = {
	"battleRanking.getRanking": `{
  rankings: Array<{
    country: string;
    value: number;
    rank: number;
    _id: string;
  }>;
}`
};

function isIdentifier(name: string): boolean {
	return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

function formatPropertyName(name: string): string {
	return isIdentifier(name) ? name : JSON.stringify(name);
}

function looksLikeIdKey(key: string): boolean {
	return (
		/^[a-f0-9]{24}$/i.test(key) ||
		/^[a-f0-9]{32}$/i.test(key) ||
		/^[a-f0-9-]{36}$/i.test(key) ||
		/^\d+$/.test(key)
	);
}

function looksLikeDynamicIdKey(key: string): boolean {
	return (
		/^[a-f0-9]{24}$/i.test(key) ||
		/^[a-f0-9]{32}$/i.test(key) ||
		/^[a-f0-9-]{36}$/i.test(key)
	);
}

function shouldUseDynamicRecordForMergedObject(keys: string[]): boolean {
	if (keys.length < 3) {
		return false;
	}

	const dynamicIdCount = keys.filter(looksLikeDynamicIdKey).length;
	return dynamicIdCount / keys.length >= 0.8;
}

function shouldUseRecord(obj: Record<string, JsonValue>): boolean {
	const keys = Object.keys(obj);
	if (keys.length === 0) {
		return false;
	}

	const idKeyCount = keys.filter(looksLikeIdKey).length;
	if (keys.length >= 5 && idKeyCount === keys.length) {
		return true;
	}

	const invalidKeyCount = keys.filter((key) => !isIdentifier(key)).length;
	if (keys.length >= 20 && invalidKeyCount / keys.length > 0.6) {
		return true;
	}

	return false;
}

function indent(level: number): string {
	return "  ".repeat(level);
}

function createGenerationContext(options: GenerationOptions): GenerationContext {
	return {
		nextInterfaceIndex: 1,
		interfacesBySignature: new Map<string, InterfaceEntry>(),
		interfaceOrder: [],
		options
	};
}

function buildObjectSignature(properties: InterfaceProperty[]): string {
	const parts = properties.map((property) => {
		const optional = property.optional ? "?" : "";
		return `${JSON.stringify(property.name)}${optional}:${property.type}`;
	});
	return `object(${parts.join(",")})`;
}

function registerNestedObjectInterface(
	properties: InterfaceProperty[],
	ctx: GenerationContext
): string {
	const signature = buildObjectSignature(properties);
	const existing = ctx.interfacesBySignature.get(signature);
	if (existing) {
		return existing.id;
	}

	const interfaceId = `A${ctx.nextInterfaceIndex++}`;
	const interfaceName = ctx.options.ignoreTypeNaming
		? interfaceId
		: buildInterfaceName(interfaceId, interfaceNameMap);

	const entry: InterfaceEntry = {
		id: interfaceName,
		signature,
		properties
	};

	ctx.interfacesBySignature.set(signature, entry);
	ctx.interfaceOrder.push(entry);
	return entry.id;
}

function renderObjectLiteral(properties: InterfaceProperty[], level: number): string {
	if (properties.length === 0) {
		return "{}";
	}

	const lines = properties.map((property) => {
		const propName = formatPropertyName(property.name);
		const optional = property.optional ? "?" : "";
		return `${indent(level + 1)}${propName}${optional}: ${property.type};`;
	});

	return `{
${lines.join("\n")}
${indent(level)}}`;
}

function finalizeObjectType(
	properties: InterfaceProperty[],
	level: number,
	mode: InferenceMode,
	ctx: GenerationContext
): string {
	if (properties.length === 0) {
		return "{}";
	}

	if (mode === "root") {
		return renderObjectLiteral(properties, level);
	}

	return registerNestedObjectInterface(properties, ctx);
}

function uniqueTypes(types: string[]): string[] {
	const seen = new Set<string>();
	const result: string[] = [];
	for (const type of types) {
		if (!seen.has(type)) {
			seen.add(type);
			result.push(type);
		}
	}
	return result;
}

function toUnion(types: string[]): string {
	const unique = uniqueTypes(types);
	if (unique.length === 0) {
		return "unknown";
	}
	if (unique.includes("unknown")) {
		return "unknown";
	}
	if (unique.length === 1) {
		return unique[0];
	}
	return unique.join(" | ");
}

function isPlainObject(value: unknown): value is Record<string, JsonValue> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNullish(value: JsonValue | undefined): value is null | undefined {
	return value === null || value === undefined;
}

function inferPropertyType(
	key: string,
	values: JsonValue[],
	level: number,
	ctx: GenerationContext,
	mode: InferenceMode
): string {
	if (key === "nextCursor") {
		return "string";
	}

	return inferMany(values, level, ctx, mode);
}

function inferMergedObjectType(
	objects: Record<string, JsonValue>[],
	level: number,
	ctx: GenerationContext,
	mode: InferenceMode
): string {
	if (objects.length === 0) {
		return "{}";
	}

	const keySet = new Set<string>();
	for (const obj of objects) {
		for (const key of Object.keys(obj)) {
			keySet.add(key);
		}
	}

	const keys = Array.from(keySet).sort((a, b) => a.localeCompare(b));
	if (keys.length === 0) {
		return "{}";
	}

	if (shouldUseDynamicRecordForMergedObject(keys)) {
		const allValues = objects.flatMap((obj) => Object.values(obj));
		const valueType = inferMany(allValues, level + 1, ctx, "nested");
		return `Record<string, ${valueType}>`;
	}

	const properties: InterfaceProperty[] = keys.map((key) => {
		const values: JsonValue[] = [];
		let seenIn = 0;
		let hasNullish = false;
		for (const obj of objects) {
			if (Object.hasOwn(obj, key)) {
				seenIn += 1;
				const value = obj[key];
				if (isNullish(value)) {
					hasNullish = true;
				} else {
					values.push(value);
				}
			}
		}

		const optional = key === "nextCursor" || seenIn < objects.length || hasNullish;
		const propType = inferPropertyType(key, values, level + 1, ctx, "nested");
		return { name: key, optional, type: propType };
	});

	return finalizeObjectType(properties, level, mode, ctx);
}

function inferMany(
	values: JsonValue[],
	level: number,
	ctx: GenerationContext,
	mode: InferenceMode
): string {
	if (values.length === 0) {
		return "unknown";
	}

	const nonNullishValues = values.filter((value) => !isNullish(value));
	if (nonNullishValues.length === 0) {
		return "unknown";
	}

	const objectValues = nonNullishValues.filter((value) => isPlainObject(value)) as Record<
		string,
		JsonValue
	>[];
	const arrayValues = nonNullishValues.filter((value) => Array.isArray(value)) as JsonValue[][];
	const primitiveValues = nonNullishValues.filter(
		(value) => value !== null && !Array.isArray(value) && typeof value !== "object"
	);

	const unionParts: string[] = [];

	if (objectValues.length > 0) {
		unionParts.push(inferMergedObjectType(objectValues, level, ctx, mode));
	}

	if (arrayValues.length > 0) {
		const flattened = arrayValues.flat();
		if (flattened.length === 0) {
			unionParts.push("unknown[]");
		} else if (flattened.every((item) => isPlainObject(item))) {
			const mergedItemType = inferMergedObjectType(
				flattened as Record<string, JsonValue>[],
				level + 1,
				ctx,
				"nested"
			);
			unionParts.push(`Array<${mergedItemType}>`);
		} else {
			unionParts.push(`Array<${inferMany(flattened, level + 1, ctx, "nested")}>`);
		}
	}

	for (const value of primitiveValues) {
		unionParts.push(inferType(value, level, ctx, mode));
	}

	return toUnion(unionParts);
}

function inferType(value: JsonValue, level: number, ctx: GenerationContext, mode: InferenceMode): string {
	if (value === null) {
		return "unknown";
	}

	if (Array.isArray(value)) {
		if (value.length === 0) {
			return "unknown[]";
		}
		if (value.every((item) => isPlainObject(item))) {
			return `Array<${inferMergedObjectType(value as Record<string, JsonValue>[], level, ctx, "nested")}>`;
		}
		return `Array<${inferMany(value, level + 1, ctx, "nested")}>`;
	}

	switch (typeof value) {
		case "string":
			return "string";
		case "number":
			return "number";
		case "boolean":
			return "boolean";
		case "object":
			return inferObjectType(value as Record<string, JsonValue>, level, ctx, mode);
		default:
			return "unknown";
	}
}

function inferObjectType(
	obj: Record<string, JsonValue>,
	level: number,
	ctx: GenerationContext,
	mode: InferenceMode
): string {
	const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
	if (keys.length === 0) {
		return "{}";
	}

	if (shouldUseRecord(obj)) {
		const union = inferMany(keys.map((key) => obj[key]), level + 1, ctx, "nested");
		return `Record<string, ${union}>`;
	}

	const properties: InterfaceProperty[] = keys.map((key) => {
		const value = obj[key];
		const propType =
			key === "nextCursor"
				? "string"
				: inferType(value, level + 1, ctx, "nested");
		return {
			name: key,
			optional: key === "nextCursor" || isNullish(value),
			type: propType
		};
	});

	return finalizeObjectType(properties, level, mode, ctx);
}

async function listJsonFiles(dir: string): Promise<string[]> {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (ignoredFiles.has(fullPath)) {
			continue;
		}
		if (entry.isDirectory()) {
			files.push(...(await listJsonFiles(fullPath)));
		} else if (entry.isFile() && entry.name.endsWith(".json")) {
			files.push(fullPath);
		}
	}

	return files;
}

async function readJson(filePath: string): Promise<JsonValue | undefined> {
	const content = await fs.readFile(filePath, "utf8");
	if (!content.trim()) {
		return undefined;
	}
	return JSON.parse(content) as JsonValue;
}

async function readJsonIfExists(filePath: string): Promise<JsonValue | undefined> {
	try {
		return await readJson(filePath);
	} catch (error) {
		const err = error as NodeJS.ErrnoException;
		if (err.code === "ENOENT") {
			return undefined;
		}
		throw error;
	}
}

function isSparseValue(value: JsonValue): boolean {
	if (Array.isArray(value)) {
		if (value.length === 0) {
			return true;
		}
		return value.every((item) => isSparseValue(item));
	}

	if (value && typeof value === "object") {
		const entries = Object.values(value);
		if (entries.length === 0) {
			return true;
		}
		return entries.every((entry) => isSparseValue(entry));
	}

	return false;
}

async function getBackupPayloadsForFile(filePath: string, limit = 5): Promise<JsonValue[]> {
	const relativePath = path.relative(outputsRoot, filePath);
	if (!relativePath || relativePath.startsWith("..")) {
		return [];
	}

	let backupDirs: string[] = [];
	try {
		const entries = await fs.readdir(outputBackupsRoot, { withFileTypes: true });
		backupDirs = entries
			.filter((entry) => entry.isDirectory() && entry.name.startsWith("outputs-"))
			.map((entry) => entry.name)
			.sort((a, b) => b.localeCompare(a));
	} catch (error) {
		const err = error as NodeJS.ErrnoException;
		if (err.code === "ENOENT") {
			return [];
		}
		throw error;
	}

	const payloads: JsonValue[] = [];
	for (const dirName of backupDirs) {
		if (payloads.length >= limit) {
			break;
		}
		const backupPath = path.join(outputBackupsRoot, dirName, relativePath);
		const payload = await readJsonIfExists(backupPath);
		if (payload !== undefined) {
			payloads.push(payload);
		}
	}

	return payloads;
}

type FileEntry = {
	filePath: string;
	operationKey: string;
	group: string;
	name: string;
};

/** Procedures the API no longer serves; cached samples of them are skipped so their types stay gone. */
const retiredOperations = new Set([
	"worker.getWorkers",
	"worker.getTotalWorkersCount",
	"workOffer.getById",
	"workOffer.getWorkOfferByCompanyId",
	"workOffer.getWorkOffersPaginated",
]);

function toFileEntry(filePath: string): FileEntry | undefined {
	const relative = path.relative(outputsRoot, filePath).replace(/\\/g, "/");
	const parts = relative.split("/");
	if (parts.length < 2) {
		return undefined;
	}

	const group = parts[0];
	const fileName = parts[parts.length - 1];
	const name = path.basename(fileName, ".json");
	const operationKey = `${group}.${name}`;

	return {
		filePath,
		operationKey,
		group,
		name
	};
}

async function buildEntries(files: string[], ctx: GenerationContext): Promise<OutputEntry[]> {
	const entries: OutputEntry[] = [];
	const fileEntries = files
		.map(toFileEntry)
		.filter((entry): entry is FileEntry => entry !== undefined && !retiredOperations.has(entry.operationKey))
		.sort((a, b) => a.operationKey.localeCompare(b.operationKey));

	for (const fileEntry of fileEntries) {
		const payload = await readJson(fileEntry.filePath);
		if (payload === undefined) {
			continue;
		}

		const samplePayloads: JsonValue[] = [payload];
		if (isSparseValue(payload)) {
			const seededPayload = operationSeeds[fileEntry.operationKey];
			if (seededPayload) {
				samplePayloads.push(seededPayload);
			}
			const backupPayloads = await getBackupPayloadsForFile(fileEntry.filePath);
			samplePayloads.push(...backupPayloads);
		}

		const typeName = buildTypeName(fileEntry.group, fileEntry.name);
		const typeBody =
			operationTypeOverrides[fileEntry.operationKey] ??
			inferMany(samplePayloads, 0, ctx, "root");
		entries.push({ operationKey: fileEntry.operationKey, typeName, typeBody });
	}

	return entries;
}

function renderInterfaceProperties(properties: InterfaceProperty[]): string[] {
	return properties.map((property) => {
		const propName = formatPropertyName(property.name);
		const optional = property.optional ? "?" : "";
		return `  ${propName}${optional}: ${property.type};`;
	});
}

async function writeResponses(
	entries: OutputEntry[],
	ctx: GenerationContext,
	targetFile: string
): Promise<void> {
	const lines: string[] = [];
	lines.push("// Generated by Responses/convert_to_types.ts");
	lines.push("");

	for (const entry of ctx.interfaceOrder) {
		lines.push(`export interface ${entry.id} {`);
		lines.push(...renderInterfaceProperties(entry.properties));
		lines.push("}");
		lines.push("");
	}

	for (const entry of entries) {
		lines.push(`export type ${entry.typeName} = ${entry.typeBody};`);
		lines.push("");
	}

	lines.push("export interface Responses {");
	for (const entry of entries) {
		lines.push(`  \"${entry.operationKey}\": ${entry.typeName};`);
	}
	lines.push("}");
	lines.push("");

	await fs.writeFile(targetFile, lines.join("\n"), "utf8");
}

export async function generateResponseTypes(options: Partial<GenerationOptions> = {}): Promise<number> {
	const ctx = createGenerationContext({
		ignoreTypeNaming: options.ignoreTypeNaming ?? false
	});
	const jsonFiles = await listJsonFiles(outputsRoot);
	const entries = await buildEntries(jsonFiles, ctx);
	await Promise.all([
		writeResponses(entries, ctx, outputFile),
		writeResponses(entries, ctx, srcOutputFile)
	]);
	return entries.length;
}

function hasCliFlag(flag: string): boolean {
	return process.argv.slice(2).includes(flag);
}

async function main(): Promise<void> {
	const ignoreTypeNaming =
		hasCliFlag("--ignore-type-naming") || hasCliFlag("--no-type-naming");
	const entriesCount = await generateResponseTypes({ ignoreTypeNaming });
	console.log(
		`Generated ${entriesCount} response types in ${outputFile} and ${srcOutputFile}${
			ignoreTypeNaming ? " (type naming ignored)" : ""
		}`
	);
}

const invokedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const isDirectExecution = invokedFilePath === __filename;

if (isDirectExecution) {
	main().catch((error) => {
		console.error("Failed to generate response types:", error);
		process.exit(1);
	});
}
