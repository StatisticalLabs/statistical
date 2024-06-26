import {
  Client,
  Collection,
  type ApplicationCommandDataResolvable,
} from "discord.js";
import { botOptions } from "@/utils/bot-options";
import { botEnv as env } from "@statistical/env/bot";
import { readdir } from "fs/promises";
import path from "path";
import type { Command } from "./command";

const join = (...paths: string[]) => path.join(import.meta.dir, ...paths);

export class BotClient<Ready extends boolean = boolean> extends Client<Ready> {
  commands = new Collection<string, Command>();

  constructor() {
    super(botOptions);
  }

  connect() {
    this.login(env.DISCORD_TOKEN);
  }

  async register() {
    await this.registerCommands();
    await this.registerEvents();
    await this.registerFeatures();
  }

  private async registerCommands() {
    const commands: ApplicationCommandDataResolvable[] = [];
    const commandDirs = await readdir(join("../commands"));
    for (const dir of commandDirs) {
      const commandFiles = await readdir(join("../commands", dir));
      for (const file of commandFiles) {
        const command = await import(`../commands/${dir}/${file}`)
          .then((x) => x?.default)
          .catch((err) => {
            console.error(err);
            return null;
          });
        if (!command?.data || !command?.run) continue;
        this.commands.set(command.data.toJSON().name, command);
        commands.push(command.data.toJSON());
      }
    }

    this.on("ready", async () => {
      if (env.DISCORD_GUILD_ID && env.DISCORD_GUILD_ID.length) {
        const guild = this.guilds.cache.get(env.DISCORD_GUILD_ID);
        if (!guild)
          throw new Error(`No guild found with ID '${env.DISCORD_GUILD_ID}'.`);

        await guild.commands.set(commands);
        console.log(`Registered commands in ${guild.name}.`);
      } else {
        await this.application?.commands.set(commands);
        console.log("Registered commands globally.");
      }
    });
  }

  private async registerEvents() {
    const eventFiles = await readdir(join("../events"));
    for (const file of eventFiles) {
      const event = await import(`../events/${file}`)
        .then((x) => x?.default)
        .catch((err) => {
          console.error(err);
          return null;
        });
      if (!event?.name || !event?.run) continue;
      this.on(event.name, event.run.bind(null, this));
    }
  }

  private async registerFeatures() {
    const featureFiles = await readdir(join("../features"));
    for (const file of featureFiles) {
      const feature = await import(`../features/${file}`)
        .then((x) => x?.default)
        .catch((err) => {
          console.error(err);
          return null;
        });
      if (!feature) return null;
      feature(this);
    }
  }
}
