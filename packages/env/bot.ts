import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const botEnv = createEnv({
  server: {
    DISCORD_TOKEN: z.string(),
    API_PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
  },
  clientPrefix: undefined,
  runtimeEnv: Bun.env,
  emptyStringAsUndefined: true,
});
