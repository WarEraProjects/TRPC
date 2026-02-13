import { createTrpcClient } from "../src/trpc-client";

async function main() {
  const trpc = createTrpcClient({
    url: "https://api2.warera.io/trpc",
    apiKey: process.env.WARERA_API_KEY
  });
  // Test rate limiting: fire 800 requests to `tradingOrder.getTopOrders` and measure time
  const TOTAL = 800;
  console.log(`Starting ${TOTAL} requests to trpc.tradingOrder.getTopOrders`);
  const start = Date.now();

  const promises = Array.from({ length: TOTAL }, () => trpc.tradingOrder.getTopOrders({ itemCode: process.env.WARERA_ITEM_CODE ?? 'cookedFish', limit: 1 }));
  const results = await Promise.allSettled(promises);

  const duration = Date.now() - start;
  const fulfilled = results.filter((r) => r.status === "fulfilled").length;
  const rejected = results.filter((r) => r.status === "rejected").length;

  console.log(`Completed ${TOTAL} requests in ${duration} ms — ${fulfilled} ok, ${rejected} failed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
