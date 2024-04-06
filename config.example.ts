import type { Config } from "./src/utils/config";

export default {
  // The server ID where commands will be registered.
  guildId: "",
  // The amount it takes for an update to be checked.
  trackDelay: 1_000,
  // Colors used for embeds.
  colors: {
    primary: "White",
    success: "#32cd32",
    warning: "#ffa500",
    danger: "#ff5733",
  },
} satisfies Config;
