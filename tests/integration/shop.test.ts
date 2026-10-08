import { integrationTest, assert, client } from "./helpers/context";

integrationTest("shop.getLastGifts", async () => {
  const value = await client.shop.getLastGifts();

			assert(Array.isArray(value), "expected array response");
			if (value.length > 0) {
				assert(typeof value[0].giftedBy === "string", "expected string giftedBy");
				assert(typeof value[0].recipient === "string", "expected string recipient");
			}
});

integrationTest("shop.getSubscribedUsers", async () => {
  const value = await client.shop.getSubscribedUsers();

			assert(Array.isArray(value), "expected array response");
			if (value.length > 0) {
				assert(typeof value[0]._id === "string", "expected string _id");
				assert(typeof value[0].subscriptionDate === "string", "expected string subscriptionDate");
			}
});

integrationTest("shop.getTopGiftGivers", async () => {
  const value = await client.shop.getTopGiftGivers();

			assert(Array.isArray(value), "expected array response");
			if (value.length > 0) {
				assert(typeof value[0].username === "string", "expected string username");
				assert(typeof value[0].giftCount === "number", "expected numeric giftCount");
			}
});
