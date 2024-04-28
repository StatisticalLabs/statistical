import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const botEnv = createEnv({
  server: {
    DISCORD_TOKEN: z.string(),
    DISCORD_GUILD_ID: z.string().optional(),
    YOUTUBE_API_KEY: z.string().optional(),
    API_PORT: z.coerce.number().default(3001),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
  },
  clientPrefix: undefined,
  runtimeEnv: Bun.env,
  emptyStringAsUndefined: true,
});
