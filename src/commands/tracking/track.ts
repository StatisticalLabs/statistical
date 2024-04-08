import {
  EmbedBuilder,
  SlashCommandBuilder,
  type GuildTextBasedChannel,
} from "discord.js";
import type { Command } from "../../structures/command";
import { channelAutocomplete } from "../../utils/autocomplete";
import { getChannel, type YouTubeChannel } from "../../utils/youtube";
import { isTracking, subscribe } from "../../utils/db";
import config from "../../../config";
import { cache } from "../../utils/cache";
import { textChannelTypes } from "../../utils/channel-types";

export default {
  data: new SlashCommandBuilder()
    .setName("track")
    .setDescription(
      "Track a YouTube channel's latest updates in a Discord channel.",
    )
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("The YouTube channel to track.")
        .setAutocomplete(true)
        .setRequired(true),
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to send the latest updates to.")
        .addChannelTypes(...textChannelTypes)
        .setRequired(false),
    ),
  autocomplete: ({ interaction }) => channelAutocomplete(interaction),
  run: async ({ interaction }) => {
    await interaction.deferReply({
      ephemeral: true,
    });

    const textChannel =
      (interaction.options.getChannel(
        "channel",
      ) as GuildTextBasedChannel | null) ?? interaction.channel;

    const channelId = interaction.options.getString("query", true);

    const cachedChannel = await cache.get(channelId).catch(() => null);
    let channel = cachedChannel
      ? ((await JSON.parse(cachedChannel)) as YouTubeChannel)
      : null;
    if (!channel) {
      const channelFromYouTube = await getChannel(channelId);
      channel = channelFromYouTube;
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

    if (isTracking(channelId, textChannel.id))
      return interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription(
              `**${channel.name}** is already being tracked in ${channel.id === interaction.channel.id ? "this channel" : textChannel.toString()}.`,
            )
            .setColor(config.colors.danger),
        ],
        ephemeral: true,
      });

    subscribe({
      name: channel.name,
      handle: channel.handle,
      youtubeChannelId: channelId,
      channelId: textChannel.id,
      userId: interaction.user.id,
      guildId: interaction.guild.id,
    });

    interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setTitle("Success!")
          .setDescription(
            `Started tracking **${channel.name}** in ${channel.id === interaction.channel.id ? "this channel" : textChannel.toString()}.`,
          )
          .setColor(config.colors.success),
      ],
      ephemeral: true,
    });
    textChannel.send(
      `${interaction.user} has started tracking **${channel.name}** in this channel.`,
    );
  },
} satisfies Command;
