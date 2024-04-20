import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  GuildMember,
  GuildTextBasedChannel,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import type { BotClient } from "./client";

export interface ExtendedChatInputCommandInteraction
  extends ChatInputCommandInteraction<"cached"> {
  member: GuildMember;
  channel: GuildTextBasedChannel;
}

export interface Command {
  data:
    | SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  autocomplete?: ({
    client,
    interaction,
  }: {
    client: BotClient<true>;
    interaction: AutocompleteInteraction<"cached">;
  }) => any;
  run: ({
    client,
    interaction,
  }: {
    client: BotClient<true>;
    interaction: ExtendedChatInputCommandInteraction;
  }) => any;
}
