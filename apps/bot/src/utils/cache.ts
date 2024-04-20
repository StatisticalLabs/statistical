import { CACHE_DIRECTORY } from "@/constants";
import { writeFile, exists, mkdir } from "fs/promises";
import { join } from "path";

class Cache {
  private memoryCache = new Map<string, string>();

  constructor() {
    console.log("Initialized cache in path:", CACHE_DIRECTORY + ".");
    this.checkPath();
  }

  async checkPath() {
    if (!(await exists(CACHE_DIRECTORY))) await mkdir(CACHE_DIRECTORY);
  }

  async get(key: string) {
    key = key.replace(/[\\/.]/g, "");
    const memoryData = this.memoryCache.get(key);
    if (memoryData) return memoryData !== "" ? memoryData : null;
    const file = Bun.file(join(CACHE_DIRECTORY, `cache_${key}`));
    if (file.size === 0) {
      this.memoryCache.set(key, "");
      return null;
    }
    const data = await file.text();
    this.memoryCache.set(key, data);
    return data;
  }

  async set(key: string, data: string) {
    key = key.replace(/[\\/.]/g, "");
    this.memoryCache.set(key, data);
    await writeFile(join(CACHE_DIRECTORY, `cache_${key}`), data);
  }
}

const cache = new Cache();
export { cache, Cache };
