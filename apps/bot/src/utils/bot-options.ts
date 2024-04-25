import { botEnv as env } from "@statistical/env/bot";
import { GatewayIntentBits, type ClientOptions } from "discord.js";

export const botOptions = {
  intents: [GatewayIntentBits.Guilds],
  shards: env.NODE_ENV === "production" ? "auto" : undefined,
} satisfies ClientOptions;
