import { botEnv as env } from "@statistical/config/env";
import type { Config } from "@statistical/config";

export default {
  // The server ID where commands will be registered.
  guildId: env.NODE_ENV === "development" ? "1225805998027968552" : undefined,
  // The amount it takes for an update to be checked.
  trackDelay: 1_000,
  // Colors used for embeds.
  colors: {
    primary: "White",
    success: "#32cd32",
    warning: "#ffa500",
    danger: "#ff5733",
  },
  // Custom emojis used in some commands.
  emojis: {
    previous: "<:left:1059101031469953084>",
    next: "<:right:1059101034263367780>",
  },
} satisfies Config;
