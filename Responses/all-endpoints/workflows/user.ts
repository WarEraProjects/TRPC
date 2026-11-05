import type { APIClient } from "../../../src";
import type { EndpointRunner } from "../runner";
import type { CollectedIds } from "../types";

export async function runUserWorkflow(
  runner: EndpointRunner,
  ids: CollectedIds
): Promise<void> {
  const trpc = runner.client;

  const countries =
    runner.getResponse("country.getAllCountries") ??
    (await runner.loadOrFetch("country.getAllCountries", () => trpc.country.getAllCountries({})));

  const countryId = runner.requireId(
    "countryId",
    runner.resolveId(countries, ["countryId", "_id", "id"], "WARERA_COUNTRY_ID"),
    "WARERA_COUNTRY_ID"
  );

  ids.countryId = countryId;

  await runner.loadOrFetch("country.getCountryById", () => trpc.country.getCountryById({ countryId }));
  await runner.loadOrFetch("government.getByCountryId", () => trpc.government.getByCountryId({ countryId }));

  const countryIds = extractCountryIds(countries);

  const { usersByCountry, allUsers } = await collectUsersForCountries(countryIds, trpc);

  await runner.loadOrFetch("user.getUsersByCountry", async () => usersByCountry, true);

  const resolvedUserId =
    firstUserId(allUsers) ?? (process.env.WARERA_USER_ID ? String(process.env.WARERA_USER_ID) : undefined);

  const userId = runner.requireId("userId", resolvedUserId, "WARERA_USER_ID");

  ids.userId = userId;

  const countryUserIds = uniqueUserIds(allUsers);

  if (countryUserIds.length === 0) {
    await runner.loadOrFetch("user.getUserLite", () => trpc.user.getUserLite({ userId }));
  } else {
    // Keep one representative snapshot for output parity; details are fetched during pagination.
    await runner.loadOrFetch(
      "user.getUserLite",
      async () => allUsers[0] ?? trpc.user.getUserLite({ userId }),
      true
    );
  }
}

async function collectUsersForCountries(
  countryIds: string[],
  client: APIClient
): Promise<{
  usersByCountry: { items: Array<{ _id: string; createdAt?: string }>; nextCursor: null };
  allUsers: unknown[];
}> {
  const allPagedUsers: Array<{ _id: string; createdAt?: string }> = [];
  const allUserPromises: Array<Promise<unknown[]>> = [];

  for (const countryId of countryIds) {
    for await (const userPage of client.user.getUsersByCountry({
      countryId,
      autoPaginate: true,
      limit: 100,
    })) {
      allPagedUsers.push(...userPage.items);

      const userLitePromises = Promise.all(
        userPage.items.map(async (userItem) => client.user.getUserLite({ userId: userItem._id }))
      );
      allUserPromises.push(userLitePromises);
    }
  }

  const allUserArrays = await Promise.all(allUserPromises);

  return {
    usersByCountry: {
      items: dedupeUsersById(allPagedUsers),
      nextCursor: null,
    },
    allUsers: allUserArrays.flat(),
  };
}

function firstUserId(users: unknown[]): string | undefined {
  for (const user of users) {
    if (!user || typeof user !== "object" || Array.isArray(user)) {
      continue;
    }
    const value =
      (user as Record<string, unknown>).userId ??
      (user as Record<string, unknown>)._id ??
      (user as Record<string, unknown>).id;
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

function uniqueUserIds(users: unknown[]): string[] {
  const ids = new Set<string>();

  for (const user of users) {
    if (!user || typeof user !== "object" || Array.isArray(user)) {
      continue;
    }
    const value =
      (user as Record<string, unknown>).userId ??
      (user as Record<string, unknown>)._id ??
      (user as Record<string, unknown>).id;

    if (typeof value === "string" && value.length > 0) {
      ids.add(value);
    }
  }

  return [...ids];
}

function extractCountryIds(countries: unknown): string[] {
  if (!Array.isArray(countries)) {
    return [];
  }

  const countryIds = new Set<string>();
  for (const country of countries) {
    if (!country || typeof country !== "object" || Array.isArray(country)) {
      continue;
    }

    const value =
      (country as Record<string, unknown>).countryId ??
      (country as Record<string, unknown>)._id ??
      (country as Record<string, unknown>).id;

    if (typeof value === "string" && value.length > 0) {
      countryIds.add(value);
    }
  }

  return [...countryIds];
}

function dedupeUsersById(
  users: Array<{ _id: string; createdAt?: string }>
): Array<{ _id: string; createdAt?: string }> {
  const seen = new Set<string>();
  const result: Array<{ _id: string; createdAt?: string }> = [];

  for (const user of users) {
    if (seen.has(user._id)) {
      continue;
    }
    seen.add(user._id);
    result.push(user);
  }

  return result;
}
