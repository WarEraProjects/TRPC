import assert from "node:assert/strict";
import { test } from "node:test";
import { describeRequestBounds } from "../../scripts/generate-openapi";

test("request body schema descriptions state their bounds", () => {
  const properties = {
    limit: { minimum: 1, maximum: 100, description: "The limit of events to get" },
    orders: { exclusiveMinimum: 0, maximum: 100, description: "The number of orders." },
    cursor: { maxLength: 200, minLength: 1, pattern: "^[a-z]+$" },
    perPage: { minimum: 1, maximum: 100, description: "Number of companies per page (1-100)" },
    options: { properties: { count: { minimum: 1 } } },
    list: { maxItems: 5, items: { exclusiveMaximum: 100 } },
    union: {
      anyOf: [{ exclusiveMinimum: 0 }],
      oneOf: [{ maximum: 50, description: "Selected from 500 records" }],
      allOf: [{ minimum: 0, maximum: 9 }],
    },
  };
  const response = { maximum: 100, description: "The number of results." };
  const spec = {
    openapi: "3.1.0",
    paths: {
      "/list": {
        post: {
          requestBody: { content: { "application/json": { schema: { properties } } } },
          responses: { "200": { content: { "application/json": { schema: response } } } },
        },
      },
    },
  };

  describeRequestBounds(spec);

  assert.equal(properties.limit.description, "The limit of events to get. From 1 to 100.");
  assert.equal(properties.orders.description, "The number of orders. More than 0, at most 100.");
  assert.equal(properties.perPage.description, "Number of companies per page (1-100)");
  assert.deepEqual(properties.cursor, {
    maxLength: 200, minLength: 1, pattern: "^[a-z]+$", description: "At most 200 characters.",
  });
  assert.deepEqual(properties.options.properties.count, { minimum: 1, description: "At least 1." });
  assert.deepEqual(properties.list, { maxItems: 5, items: { exclusiveMaximum: 100, description: "Less than 100." } });
  assert.deepEqual(properties.union, {
    anyOf: [{ exclusiveMinimum: 0, description: "More than 0." }],
    oneOf: [{ maximum: 50, description: "Selected from 500 records. At most 50." }],
    allOf: [{ minimum: 0, maximum: 9, description: "From 0 to 9." }],
  });
  assert.deepEqual(response, { maximum: 100, description: "The number of results." });
});
