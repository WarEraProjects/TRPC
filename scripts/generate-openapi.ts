/**
 * Regenerates src/api/warera-openapi.d.ts from the API's openapi.json.
 *
 *   npm run openapi
 *
 * The spec reuses a property inside a request body with a `$ref` relative to that body's own
 * schema, for example `"muId": { "$ref": "#/properties/countryId" }` in ranking.getRankingPage.
 * openapi-typescript reads `#/` as the root of the whole document, cannot find the target and
 * stops with "Can't resolve $ref". This script inlines those references before generating, and
 * fails on a reference that resolves in neither place.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString, COMMENT_HEADER, type OpenAPI3 } from "openapi-typescript";

const root = path.resolve(import.meta.dirname, "..");
const specUrl = "https://api2.warera.io/openapi.json";
const outputFile = path.join(root, "src/api/warera-openapi.d.ts");

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

function isObject(value: Json | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Resolves a local JSON pointer such as `#/properties/countryId` inside `base`. */
function resolvePointer(base: Json, ref: string): Json | undefined {
  if (!ref.startsWith("#/")) return undefined;
  let node: Json | undefined = base;
  for (const raw of ref.slice(2).split("/")) {
    const key = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (Array.isArray(node)) node = node[Number(key)];
    else if (isObject(node)) node = node[key];
    else return undefined;
    if (node === undefined) return undefined;
  }
  return node;
}

/**
 * Replaces every `$ref` under `node` that does not resolve against the document but does resolve
 * against `schemaRoot`, the schema it was written in. Keys next to the `$ref`, such as a
 * `description`, win over the target's. Returns how many references were inlined.
 *
 * `seen` holds the references being expanded around `node`, so a target that contains itself
 * fails instead of recursing forever.
 */
function inlineSchemaRefs(node: Json, schemaRoot: Json, document: Json, where: string, seen: string[] = []): number {
  // Array elements are checked like object values: a `$ref` can sit directly in an `anyOf` list.
  if (!isObject(node) && !Array.isArray(node)) return 0;
  const children = node as Record<string, Json>;

  let count = 0;
  for (const [key, child] of Object.entries(children)) {
    if (!isObject(child) || typeof child.$ref !== "string" || resolvePointer(document, child.$ref) !== undefined) {
      count += inlineSchemaRefs(child, schemaRoot, document, where, seen);
      continue;
    }
    const { $ref, ...siblings } = child;
    if (seen.includes($ref)) throw new Error(`${where}: circular $ref ${[...seen, $ref].join(" -> ")}`);
    const target = resolvePointer(schemaRoot, $ref);
    if (!isObject(target)) throw new Error(`${where}: cannot resolve $ref ${$ref}`);
    // The target can itself be a `$ref`, so its copy goes through the same pass. Only the copy is
    // inside this reference; the keys next to the `$ref` are not.
    const holder: JsonObject = { inlined: structuredClone(target) };
    count += 1 + inlineSchemaRefs(holder, schemaRoot, document, where, [...seen, $ref]);
    count += inlineSchemaRefs(siblings, schemaRoot, document, where, seen);
    children[key] = { ...(holder.inlined as JsonObject), ...siblings };
  }
  return count;
}

/** Applies `inlineSchemaRefs` to every request and response body schema in the spec. */
function inlineAllSchemaRefs(spec: JsonObject): number {
  let count = 0;
  const paths = isObject(spec.paths) ? spec.paths : {};
  for (const [pathName, pathItem] of Object.entries(paths)) {
    if (!isObject(pathItem)) continue;
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!isObject(operation)) continue;
      const bodies: Json[] = [operation.requestBody, ...Object.values(isObject(operation.responses) ? operation.responses : {})];
      for (const body of bodies) {
        if (!isObject(body) || !isObject(body.content)) continue;
        for (const [mediaType, media] of Object.entries(body.content)) {
          if (!isObject(media) || !isObject(media.schema)) continue;
          count += inlineSchemaRefs(media.schema, media.schema, spec, `${method.toUpperCase()} ${pathName} ${mediaType}`);
        }
      }
    }
  }
  return count;
}

/** Appends the bounds of `schema` and of the schemas nested in it to their descriptions. */
function describeSchemaBounds(schema: Json | undefined): void {
  if (!isObject(schema)) return;
  if (isObject(schema.properties)) {
    for (const property of Object.values(schema.properties)) describeSchemaBounds(property);
  }
  describeSchemaBounds(schema.items);
  for (const variants of [schema.anyOf, schema.oneOf, schema.allOf]) {
    if (!Array.isArray(variants)) continue;
    for (const variant of variants) describeSchemaBounds(variant);
  }

  const { minimum, maximum, exclusiveMinimum, exclusiveMaximum, maxLength } = schema;
  const lowerExclusive = typeof exclusiveMinimum === "number" && (typeof minimum !== "number" || exclusiveMinimum >= minimum);
  const upperExclusive = typeof exclusiveMaximum === "number" && (typeof maximum !== "number" || exclusiveMaximum <= maximum);
  const lower = lowerExclusive ? exclusiveMinimum : minimum;
  const upper = upperExclusive ? exclusiveMaximum : maximum;
  if (![lower, upper, maxLength].some((value) => typeof value === "number")) return;

  // No check for a description that already names its bounds: a number in it can mean something
  // else ("Base64", "default 1"), and stating a bound twice is better than leaving it out.
  const description = typeof schema.description === "string" ? schema.description.trimEnd() : "";

  const lowerLimit = typeof lower === "number" ? `${lowerExclusive ? "more than" : "at least"} ${lower}` : "";
  const upperLimit = typeof upper === "number" ? `${upperExclusive ? "less than" : "at most"} ${upper}` : "";
  const range = lowerLimit && upperLimit && !lowerExclusive && !upperExclusive
    ? `from ${lower} to ${upper}`
    : [lowerLimit, upperLimit].filter(Boolean).join(", ");
  const length = typeof maxLength === "number" ? `at most ${maxLength} characters` : "";
  const suffix = [range, length].filter(Boolean)
    .map((sentence) => `${sentence[0].toUpperCase()}${sentence.slice(1)}.`).join(" ");
  schema.description = description ? `${description}${description.endsWith(".") ? " " : ". "}${suffix}` : suffix;
}

/**
 * openapi-typescript keeps a schema's `description` as JSDoc but drops `minimum`, `maximum`,
 * `exclusiveMinimum`, `exclusiveMaximum` and `maxLength`, so a caller learned a bound such as
 * `limit` 1 to 100 from a BAD_REQUEST. This writes the bounds of every request body field into
 * its description, for example "The limit of events to get. From 1 to 100."
 */
export function describeRequestBounds(spec: JsonObject): void {
  if (!isObject(spec.paths)) return;
  for (const pathItem of Object.values(spec.paths)) {
    if (!isObject(pathItem)) continue;
    for (const operation of Object.values(pathItem)) {
      if (!isObject(operation) || !isObject(operation.requestBody) || !isObject(operation.requestBody.content)) continue;
      for (const media of Object.values(operation.requestBody.content)) {
        if (isObject(media)) describeSchemaBounds(media.schema);
      }
    }
  }
}

async function main() {
  const response = await fetch(specUrl);
  if (!response.ok) throw new Error(`GET ${specUrl}: HTTP ${response.status}`);
  const spec = (await response.json()) as JsonObject;

  const inlined = inlineAllSchemaRefs(spec);
  describeRequestBounds(spec);
  const ast = await openapiTS(spec as unknown as OpenAPI3);
  fs.writeFileSync(outputFile, `${COMMENT_HEADER}${astToString(ast)}`, "utf8");

  const operations = Object.keys(isObject(spec.paths) ? spec.paths : {}).length;
  console.log(`${path.relative(root, outputFile)}: ${operations} operations, ${inlined} schema-relative $ref(s) inlined`);
}

const invokedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const isDirectExecution = invokedFilePath === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
