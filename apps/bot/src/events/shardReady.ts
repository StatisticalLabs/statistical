import { event } from "@/structures/event";

export default event("shardReady", (_, id) =>
  console.log(`Launched shard #${id}.`),
);
