import { integrationTest, assert, client, testIds } from "./helpers/context";

integrationTest("donation.getManyPaginated", async () => {
  const value = await client.donation.getManyPaginated({ muId: testIds.muId, limit: 20, direction: "forward" });

			assert(Array.isArray(value.items), "expected items array");

			assert(value.nextCursor === undefined || typeof value.nextCursor === "string", "expected optional string nextCursor");
}, ["muId"]);

integrationTest("donation.getTotalDonations", async () => {
  const value = await client.donation.getTotalDonations({ muId: testIds.muId });

			assert(typeof value.totalAmount === "number", "expected numeric totalAmount");
			assert(typeof value.donorCount === "number", "expected numeric donorCount");
}, ["muId"]);
