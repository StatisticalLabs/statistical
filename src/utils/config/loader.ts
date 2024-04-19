import type { Config } from "./validator";
import { exists } from "fs/promises";

export async function loadConfig(): Promise<Config> {
  if (await exists("./config.ts")) {
    const config = await import("../../../config").then((x) => x?.default);
    return config;
  }
  throw new SyntaxError("No configuration file found");
}

export default await loadConfig();
