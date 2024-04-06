import type { Config } from "./src/utils/config";

export default {
  // The server ID where commands will be registered.
  guildId: "",
  // The amount it takes for an update to be checked.
  trackDelay: 5_000,
} satisfies Config;
