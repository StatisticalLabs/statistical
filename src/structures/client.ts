import { Client } from "discord.js";
import { botOptions } from "../utils/bot-options";
import { env } from "../utils/env";
import { readdir } from "fs/promises";
import { join } from "path";

export class BotClient<Ready extends boolean = boolean> extends Client<Ready> {
  constructor() {
    super(botOptions);
  }

  connect() {
    this.login(env.DISCORD_TOKEN);
  }

  async register() {
    await this.registerEvents();
  }

  private async registerEvents() {
    const eventFiles = await readdir(join(import.meta.dir, "../events"));
    for (const file of eventFiles) {
      const event = await import(`../events/${file}`)
        .then((x) => x?.default)
        .catch((err) => {
          console.error(err);
          return null;
        });
      if (!event?.name || !event?.run) return;
      this.on(event.name, event.run.bind(null, this));
    }
  }
}
