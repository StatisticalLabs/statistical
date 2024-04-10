import { z } from "zod";
import type { ColorResolvable } from "discord.js";

export const configSchema = z.object({
  guildId: z.string().optional(),
  trackDelay: z.number().default(5_000),
  colors: z.object({
    primary: z.string(),
    success: z.string(),
    warning: z.string(),
    danger: z.string(),
  }),
  emojis: z.object({
    previous: z.string().default("◀️"),
    next: z.string().default("▶️"),
  }),
});
export type Config = Omit<z.infer<typeof configSchema>, "colors"> & {
  colors: Record<keyof z.infer<typeof configSchema>["colors"], ColorResolvable>;
};

import config from "../../config";
const parsed = configSchema.safeParse(config);
if (parsed.success === false) {
  console.error(
    "❌ Invalid configuration:",
    parsed.error.flatten().fieldErrors,
  );
  throw new SyntaxError("Invalid configuration");
}
