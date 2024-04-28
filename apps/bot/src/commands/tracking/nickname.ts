import type { Command } from "@/structures/command";
import { abbreviate } from "@/utils/abbreviate";
import { channelAutocomplete } from "@/utils/autocomplete";
import { cache } from "@/utils/cache";
import {
  isTracking,
  isTrackingAny,
  subscribe,
  unsubscribeAll,
} from "@/utils/db";
import { getChannel, type YouTubeChannel } from "@/utils/youtube";
import config from "config";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("nickname")
    .setDescription("Manage tracking in your nickname.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("track")
        .setDescription(
          "Track a YouTube channel's subscriber count in your nickname.",
        )
        .addStringOption((option) =>
          option
            .setName("query")
            .setDescription("The YouTube channel to track.")
            .setAutocomplete(true)
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("untrack")
        .setDescription(
          "Stop tracking a YouTube channel's subscriber count in your nickname.",
        ),
    ),
  autocomplete: ({ interaction }) => {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "track":
        return channelAutocomplete(interaction);
      default:
        return interaction.respond([]);
    }
  },
  run: async ({ interaction }) => {
    await interaction.deferReply({
      ephemeral: true,
    });

    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "track":
        {
          if (!interaction.guild.members.me?.permissions.has("ManageNicknames"))
            return interaction.followUp({
              embeds: [
                new EmbedBuilder()
                  .setTitle("Error")
                  .setDescription(
                    "I cannot update nicknames. Ask a server admin to allow me to do so.",
                  )
                  .setColor(config.colors.danger),
              ],
              ephemeral: true,
            });

          if (interaction.guild.ownerId === interaction.user.id)
            return interaction.followUp({
              embeds: [
                new EmbedBuilder()
                  .setTitle("Error")
                  .setDescription(
                    "I cannot update your nickname because you are an owner. Discord does not currently allow any member to update the owner's username.",
                  )
                  .setColor(config.colors.danger),
              ],
              ephemeral: true,
            });

          if (
            interaction.member.roles.highest.position >=
            interaction.guild.members.me?.roles.highest.position
          )
            return interaction.followUp({
              embeds: [
                new EmbedBuilder()
                  .setTitle("Error")
                  .setDescription(
                    "I cannot update your nickname because your role is above mine. Ask a server admin to raise my role higher.",
                  )
                  .setColor(config.colors.danger),
              ],
              ephemeral: true,
            });

          const channelId = interaction.options.getString("query", true);

          const cachedChannel = await cache.get(channelId).catch(() => null);
          let channel = cachedChannel
            ? ((await JSON.parse(cachedChannel)) as YouTubeChannel)
            : null;
          if (!channel) {
            const channelFromYouTube = await getChannel(channelId);
            channel = channelFromYouTube;
            if (channel) await cache.set(channelId, JSON.stringify(channel));
          }

          if (!channel)
            return interaction.followUp({
              embeds: [
                new EmbedBuilder()
                  .setTitle("Error")
                  .setDescription(`No channel found with ID **${channelId}**.`)
                  .setColor(config.colors.danger),
              ],
              ephemeral: true,
            });

          if (isTracking(channelId, interaction.user.id, true))
            return interaction.followUp({
              embeds: [
                new EmbedBuilder()
                  .setTitle("Error")
                  .setDescription(
                    `**${channel.name}** is already being tracked in your nickname.`,
                  )
                  .setColor(config.colors.danger),
              ],
              ephemeral: true,
            });

          unsubscribeAll(interaction.user.id, true);

          subscribe({
            name: channel.name,
            handle: channel.handle,
            avatar: channel.avatar,
            youtubeChannelId: channelId,
            userId: interaction.user.id,
            guildId: interaction.guild.id,
          });

          const displayName = interaction.member.displayName.replace(
            /\s+\[\d+(\.\d+)?[KkMmBbTt]?\]$/,
            "",
          );
          interaction.member.setNickname(
            `${displayName} [${abbreviate(channel.subscribers)}]`,
          );

          interaction.followUp({
            embeds: [
              new EmbedBuilder()
                .setTitle("Success!")
                .setDescription(
                  `Started tracking **${channel.name}** in your nickname.`,
                )
                .setColor(config.colors.success),
            ],
            ephemeral: true,
          });
        }
        break;
      case "untrack":
        {
          if (!isTrackingAny(interaction.user.id, true))
            return interaction.followUp({
              embeds: [
                new EmbedBuilder()
                  .setTitle("Error")
                  .setDescription(
                    "You are not tracking any channel in your nickname.",
                  )
                  .setColor(config.colors.danger),
              ],
              ephemeral: true,
            });

          unsubscribeAll(interaction.user.id, true);

          if (
            interaction.guild.members.me?.permissions.has("ManageNicknames") &&
            interaction.guild.ownerId !== interaction.user.id &&
            interaction.member.roles.highest.position <
              interaction.guild.members.me?.roles.highest.position
          ) {
            const displayName = interaction.member.displayName.replace(
              /\s+\[\d+(\.\d+)?[KkMmBbTt]?\]$/,
              "",
            );
            interaction.member.setNickname(displayName);
          }

          interaction.followUp({
            embeds: [
              new EmbedBuilder()
                .setTitle("Success!")
                .setDescription(
                  "Stopped tracking all channels in your nickname.",
                )
                .setColor(config.colors.success),
            ],
            ephemeral: true,
          });
        }
        break;
    }
  },
} satisfies Command;
