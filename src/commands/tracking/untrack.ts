import {
  EmbedBuilder,
  SlashCommandBuilder,
  type GuildTextBasedChannel,
} from "discord.js";
import type { Command } from "../../structures/command";
import { trackedChannelAutocomplete } from "../../utils/autocomplete";
import { getChannel, type YouTubeChannel } from "../../utils/youtube";
import config from "../../../config";
import { isTracking, unsubscribe } from "../../utils/db";
import { cache } from "../../utils/cache";
import { textChannelTypes } from "../../utils/channel-types";

export default {
  data: new SlashCommandBuilder()
    .setName("untrack")
    .setDescription("Stop tracking a YouTube channel.")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("The YouTube channel to stop tracking.")
        .setAutocomplete(true)
        .setRequired(true),
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription(
          "The channel where this YouTube channel is being tracked.",
        )
        .addChannelTypes(...textChannelTypes)
        .setRequired(false),
    ),
  autocomplete: ({ interaction }) => trackedChannelAutocomplete(interaction),
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
      if (channel) await cache.set(channelId, JSON.stringify(channel));
    }

    if (!isTracking(channelId, textChannel.id))
      return interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription(
              `${channel?.name ? `**${channel.name}**` : "The YouTube channel you specified"} is not being tracked in ${textChannel.id === interaction.channel.id ? "this channel" : textChannel.toString()}.`,
            )
            .setColor(config.colors.danger),
        ],
        ephemeral: true,
      });

    unsubscribe({
      youtubeChannelId: channelId,
      channelId: interaction.channel.id,
    });

    interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setTitle("Success!")
          .setDescription(
            `Stopped tracking ${channel?.name ? `**${channel.name}**` : "the YouTube channel you specified"} in ${textChannel.id === interaction.channel.id ? "this channel" : textChannel.toString()}.`,
          )
          .setColor(config.colors.success),
      ],
      ephemeral: true,
    });
    if (channel)
      textChannel.send(
        `${interaction.user} has stopped tracking **${channel.name}** in this channel.`,
      );
  },
} satisfies Command;
