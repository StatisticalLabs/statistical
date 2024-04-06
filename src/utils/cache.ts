import { writeFile } from "fs/promises";
import { join } from "path";

class Cache {
  path = "cache";
  private memoryCache = new Map<string, string>();

  constructor(path?: string) {
    if (path) this.path = path;
    console.log("Initialized cache in path:", this.path + ".");
  }

  async get(key: string) {
    key = key.replace(/[\\/.]/g, "");
    const memoryData = this.memoryCache.get(key);
    if (memoryData) return memoryData !== "" ? memoryData : null;
    const file = Bun.file(join(this.path, `cache_${key}`));
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
    await writeFile(join(this.path, `cache_${key}`), data);
  }
}

const cache = new Cache();
export { cache, Cache };
