import { EmbedBuilder, SlashCommandBuilder, time } from "discord.js";
import type { Command } from "../../structures/command";
import { getChannel, type YouTubeChannel } from "../../utils/youtube";
import { cache } from "../../utils/cache";
import config from "../../../config";
import { abbreviate } from "../../utils/abbreviate";
import { channelAutocomplete } from "../../utils/autocomplete";
import { getYouTubeChannel } from "../../utils/db";
import { gain } from "../../utils/gain";

export default {
  data: new SlashCommandBuilder()
    .setName("channel")
    .setDescription("Get information about a YouTube channel.")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("The YouTube channel to get information about.")
        .setAutocomplete(true)
        .setRequired(true),
    ),
  autocomplete: ({ interaction }) => channelAutocomplete(interaction),
  run: async ({ interaction }) => {
    await interaction.deferReply({
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
    }
    if (!channel)
      return interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription(`No channel found with ID **${channelId}**.`)
            .setColor(config.colors.danger),
        ],
      });

    const dbChannel = getYouTubeChannel(channelId);

    interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: `${channel.name}${channel.handle ? ` (${channel.handle})` : ""}`,
            iconURL: channel.avatar,
            url: `https://youtube.com/${channel.handle ?? `channel/${channel.id}`}`,
          })
          .addFields(
            {
              name: "Subscribers",
              value: abbreviate(channel.subscribers),
              inline: true,
            },
            {
              name: "Views",
              value: channel.views.toLocaleString(),
              inline: true,
            },
            {
              name: "Videos",
              value: channel.videos.toLocaleString(),
              inline: true,
            },
            {
              name: "Subscribers/day",
              value:
                dbChannel && dbChannel.currentUpdate
                  ? `${gain(dbChannel.currentUpdate.subscriberRate * (60 * 60 * 24), true)}`
                  : "None",
              inline: true,
            },
            {
              name: "Subscribers/second",
              value:
                dbChannel && dbChannel.currentUpdate
                  ? `${gain(dbChannel.currentUpdate.subscriberRate)}`
                  : "None",
              inline: true,
            },
            {
              name: `Channels tracking ${channel.name}`,
              value: (dbChannel?.trackers?.length ?? 0).toLocaleString(),
            },
            {
              name: "Created",
              value: time(channel.createdAt, "F"),
            },
            {
              name: "Last update",
              value:
                dbChannel && dbChannel.currentUpdate
                  ? time(new Date(dbChannel.currentUpdate.timeHit), "F")
                  : "None",
            },
          )
          .setImage(`https://www.banner.yt/${channelId}`)
          .setColor(config.colors.primary),
      ],
    });
  },
} satisfies Command;
