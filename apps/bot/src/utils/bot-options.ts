import { botEnv as env } from "@statistical/env/bot";
import {
  GatewayIntentBits,
  type ClientOptions,
  ActivityType,
} from "discord.js";

export const botOptions = {
  intents: [GatewayIntentBits.Guilds],
  shards: env.NODE_ENV === "production" ? "auto" : undefined,
  presence: {
    activities: [
      {
        name: "subscriber updates",
        type: ActivityType.Listening,
      },
    ],
  },
} satisfies ClientOptions;
