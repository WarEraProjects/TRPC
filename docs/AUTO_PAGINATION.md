# Auto-Pagination Feature

## Overview

This tRPC client now supports automatic cursor-based pagination for endpoints that return paginated results. This allows you to easily iterate through all pages of data without manually managing cursors.

## Supported Endpoints

Auto-pagination applies to procedures with a `cursor` input and an `{ items, nextCursor }` response.

From the OpenAPI schema:

- `article.getArticlesPaginated`
- `battle.getBattles`
- `battleRanking.getRanking`
- `company.getCompanies`
- `event.getEventsPaginated`
- `mercenaryContractAuction.getPaginatedAuctions`
- `mu.getManyPaginated`
- `poll.getPollVoters`
- `transaction.getPaginatedTransactions`
- `user.getUsersByCountry`

Packaged custom endpoints:

- `alliance.getManyPaginated`
- `donation.getManyPaginated`
- `election.getElections`
- `giveaway.getManyPaginated`
- `managerOffer.getManyPaginated`
- `party.getManyPaginated`
- `sanction.getPaginated`
- `tournament.getManyPaginated`
- `upgradeConstruction.listConstructions`

The page-based `contribution.getCountryUnrestContributions` and `contribution.getRegionContributions` use `page`, not a cursor; see the [README](../README.md#custom-endpoint-constraints).

## Usage

### Basic Auto-Pagination

To enable auto-pagination, add `autoPaginate: true` to your request:

```typescript
import { createAPIClient } from "@wareraprojects/api";

const client = createAPIClient({
  apiKey: "your-api-key" // optional
});

// Iterate through 20 pages
for await (const page of client.article.getArticlesPaginated({
  type: "last",
  limit: 20,
  autoPaginate: true,
  maxPages: 20
})) {
  console.log(`Received ${page.items.length} articles`);
  
  // Process items
  page.items.forEach(article => {
    console.log(article.title);
  });
  
  // page.cursor is the cursor for the next page, or "" on the last page
  console.log(`Cursor: ${page.cursor}`);
}
```

### Options

`autoPaginate`, `maxPages`, and `cursorEnd` are client-side options and are never sent to the server.

#### `autoPaginate: boolean`

When set to `true`, the client returns an `AsyncIterableIterator` that yields pages until all data is retrieved.

```typescript
import type { PaginationOptions } from "@wareraprojects/api";

const options = {
  autoPaginate: true
} satisfies PaginationOptions;
```

#### `maxPages?: number`

Limit the maximum number of pages to retrieve. Useful to prevent runaway pagination or for testing.

```typescript
import type { PaginationOptions } from "@wareraprojects/api";

const options = {
  autoPaginate: true,
  maxPages: 5  // Stop after 5 pages
} satisfies PaginationOptions;
```

**Default**: `Infinity` (no limit)

#### `cursorEnd?: Date`

Stop pagination when the next cursor's date becomes older than this date. The cursor format includes a timestamp that is parsed and compared.

```typescript
import type { PaginationOptions } from "@wareraprojects/api";

const options = {
  autoPaginate: true,
  cursorEnd: new Date("2026-02-15")  // Stop when the next cursor is before this date
} satisfies PaginationOptions;
```

**Default**: `undefined` (no date filtering)

**Note**: Cursors have the format `"{date}|{id}"`. The date portion is extracted and parsed for comparison.

## Return Types

### With Auto-Pagination

When `autoPaginate: true`, the function returns an `AsyncIterableIterator<PageResult<K>>`:

```typescript
import type { PageResult } from "@wareraprojects/api";

type ArticlePage = {
  items: PageResult<"article.getArticlesPaginated">["items"]; // Items for this page
  cursor: string; // Cursor for the next page, or "" on the last page
};
```

### Without Auto-Pagination (Regular Call)

Without `autoPaginate`, the function returns a `Promise` with the regular response:

```typescript
import type { ResponseFor } from "@wareraprojects/api";

type ArticleResponse = ResponseFor<"article.getArticlesPaginated">; // { items, nextCursor }
```

## Examples

### Example 1: Collect All Items

```typescript
import { createAPIClient, type BattleListItem } from "@wareraprojects/api";

const client = createAPIClient();
const allBattles: BattleListItem[] = [];

for await (const page of client.battle.getBattles({
  autoPaginate: true,
  maxPages: 10,
  limit: 50
})) {
  allBattles.push(...page.items);
}

console.log(`Total battles: ${allBattles.length}`);
```

### Example 2: Date-Based Filtering

```typescript
import { createAPIClient, type EventListItem } from "@wareraprojects/api";

declare function processEvents(events: EventListItem[]): void;

const client = createAPIClient();
// Get all events from the last week
const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

for await (const page of client.event.getEventsPaginated({
  autoPaginate: true,
  cursorEnd: oneWeekAgo,
  limit: 100
})) {
  processEvents(page.items);
}
```

### Example 3: Early Termination

`company.getCompanies` returns company ID strings in `items`. Its server inputs are optional `userId`, `perPage` (1–100), and `cursor`.

```typescript
import { createAPIClient } from "@wareraprojects/api";

const client = createAPIClient();
const targetCompanyId = "target-company-id";
let foundTarget = false;

for await (const page of client.company.getCompanies({
  autoPaginate: true,
  perPage: 50
})) {
  for (const companyId of page.items) {
    if (companyId === targetCompanyId) {
      foundTarget = true;
      break;
    }
  }
  
  if (foundTarget) {
    break; // Exit the async iteration
  }
}
```

### Example 4: Regular (Non-Paginated) Call

```typescript
import { createAPIClient } from "@wareraprojects/api";

const client = createAPIClient();
// Regular single-page request (backward compatible)
const result = await client.article.getArticlesPaginated({
  type: "last",
  limit: 10
  // No autoPaginate flag
});

console.log(`Items: ${result.items.length}`);
console.log(`Next cursor: ${result.nextCursor}`);
```

## Type Safety

The implementation is fully type-safe:

- Pagination options are exposed on procedures with cursor-based inputs; auto-pagination requires the response pattern listed above
- Return types automatically adjust based on whether `autoPaginate` is used
- `PageResult<K>` correctly infers item types from the endpoint

```typescript
import { createAPIClient } from "@wareraprojects/api";

const client = createAPIClient();
// TypeScript knows this returns AsyncIterableIterator
const iterator = client.article.getArticlesPaginated({
  type: "last",
  autoPaginate: true
});

for await (const page of iterator) {
  // page.items is correctly typed as ArticleListItem[]
  // page.cursor is a string
  page.items.forEach(article => {
    console.log(article.title); // TypeScript knows about 'title'
  });
}
```

## Rate Limiting

Auto-pagination respects the existing rate limiting:

- Default: 100 requests per minute (without API key)
- With API key: 200 requests per minute
- Configurable via `rateLimit` option

Each page request counts toward the rate limit and is automatically queued and delayed as needed.

## Termination Conditions

Auto-pagination stops when any of the following conditions is met:

1. **No next cursor**: The API returns an empty, null, or missing `nextCursor`
2. **Empty page**: The returned `items` array is empty
3. **Invalid cursor**: The `nextCursor` contains the text `undefined`
4. **Max pages reached**: The `maxPages` limit is hit
5. **Cursor date exceeded**: When using `cursorEnd`, the next cursor's date is older than the specified date

## Error Handling

Errors during pagination will throw and stop the iteration:

```typescript
import { createAPIClient } from "@wareraprojects/api";

const client = createAPIClient();
try {
  for await (const page of client.battle.getBattles({
    autoPaginate: true
  })) {
    // Process page
  }
} catch (error) {
  console.error("Pagination failed:", error);
}
```

## Migration Guide

Existing code continues to work without changes:

```typescript
import { createAPIClient } from "@wareraprojects/api";

const client = createAPIClient();
const someCursor = "2026-02-15T00:00:00Z|article-id";
// Before (still works)
const result = await client.article.getArticlesPaginated({
  type: "last",
  limit: 10,
  cursor: someCursor
});

// New feature (opt-in)
for await (const page of client.article.getArticlesPaginated({
  type: "last",
  limit: 10,
  autoPaginate: true
})) {
  // ...
}
```

## Implementation Notes

- Cursor format: `"{date}|{id}"` where date is a parseable date string
- Empty cursors, malformed cursors, or unparseable dates are handled gracefully
- Supported endpoints follow the same response pattern: `{ items: T[], nextCursor }`; `nextCursor` may be empty or missing on the last page
- The feature is zero-cost for non-paginated endpoints and backward compatible
