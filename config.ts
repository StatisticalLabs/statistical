import type { Config } from "@statistical/config";

export default {
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
