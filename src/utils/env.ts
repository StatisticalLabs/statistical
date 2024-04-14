import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DISCORD_TOKEN: z.string(),
    API_PORT: z.coerce.number().default(3000),
  },
  clientPrefix: undefined,
  runtimeEnv: Bun.env,
  emptyStringAsUndefined: true,
});
