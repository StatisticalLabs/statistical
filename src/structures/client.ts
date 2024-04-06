import { Client } from "discord.js";
import { botOptions } from "../utils/bot-options";
import { env } from "../utils/env";

export class BotClient<Ready extends boolean = boolean> extends Client<Ready> {
  constructor() {
    super(botOptions);
  }

  connect() {
    this.login(env.DISCORD_TOKEN);
  }
}
