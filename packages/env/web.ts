import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const webEnv = createEnv({
  server: {
    API_URL: z.string().default("http://localhost:3001"),
  },
  client: {},
  runtimeEnv: {
    API_URL: process.env.API_URL,
  },
  emptyStringAsUndefined: true,
});
