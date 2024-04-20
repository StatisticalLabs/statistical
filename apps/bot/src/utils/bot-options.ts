import { GatewayIntentBits, type ClientOptions } from "discord.js";

export const botOptions = {
  intents: [GatewayIntentBits.Guilds],
} satisfies ClientOptions;
