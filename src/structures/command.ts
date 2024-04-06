import type {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import type { BotClient } from "./client";

export interface ExtendedChatInputCommandInteraction
  extends ChatInputCommandInteraction<"cached"> {
  member: GuildMember;
}

export interface Command {
  data:
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  run: ({
    client,
    interaction,
  }: {
    client: BotClient<true>;
    interaction: ExtendedChatInputCommandInteraction;
  }) => any;
}
