import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
  time,
} from "discord.js";
import type { Command } from "@/structures/command";
import { getChannel, type YouTubeChannel } from "@/utils/youtube";
import { cache } from "@/utils/cache";
import config from "config";
import { abbreviate } from "@/utils/abbreviate";
import { channelAutocomplete } from "@/utils/autocomplete";
import { getYouTubeChannel } from "@/utils/db";
import { gain } from "@/utils/gain";

function calculateNextMilestone(
  subscriberCount: number,
  isDecreasing: boolean,
) {
  let milestone = 0;
  if (isDecreasing) {
    if (subscriberCount > 100000000)
      milestone = Math.ceil(subscriberCount / 1000000) * 1000000 - 1000000;
    else if (subscriberCount > 10000000)
      milestone = Math.ceil(subscriberCount / 100000) * 100000 - 100000;
    else if (subscriberCount > 1000000)
      milestone = Math.ceil(subscriberCount / 10000) * 10000 - 10000;
    else if (subscriberCount > 100000)
      milestone = Math.ceil(subscriberCount / 1000) * 1000 - 1000;
    else if (subscriberCount > 10000)
      milestone = Math.ceil(subscriberCount / 100) * 100 - 100;
    else if (subscriberCount > 1000)
      milestone = Math.ceil(subscriberCount / 10) * 10 - 10;
    else milestone = subscriberCount - 1;
  } else {
    if (subscriberCount >= 100000000)
      milestone = Math.floor(subscriberCount / 1000000) * 1000000 + 1000000;
    else if (subscriberCount >= 10000000)
      milestone = Math.floor(subscriberCount / 100000) * 100000 + 100000;
    else if (subscriberCount >= 1000000)
      milestone = Math.floor(subscriberCount / 10000) * 10000 + 10000;
    else if (subscriberCount >= 100000)
      milestone = Math.floor(subscriberCount / 1000) * 1000 + 1000;
    else if (subscriberCount >= 10000)
      milestone = Math.floor(subscriberCount / 100) * 100 + 100;
    else if (subscriberCount >= 1000)
      milestone = Math.floor(subscriberCount / 10) * 10 + 10;
    else milestone = subscriberCount + 1;
  }
  return milestone;
}

function calculateTimeUntilNextMilestone(stats: {
  subscriberCount: number;
  subscriberRate: number;
  lastUpdated: string;
}) {
  const isDecreasing = stats.subscriberRate < 0;
  const nextMilestone = calculateNextMilestone(
    stats.subscriberCount,
    isDecreasing,
  );
  const neededSubsForNextMilestone = isDecreasing
    ? stats.subscriberCount - nextMilestone
    : nextMilestone - stats.subscriberCount;
  const daysToNextMilestone =
    neededSubsForNextMilestone /
    Math.abs(stats.subscriberRate * (60 * 60 * 24));
  const lastUpdatedEpoch = new Date(stats.lastUpdated).getTime();
  return `<t:${Math.floor((lastUpdatedEpoch + daysToNextMilestone * 86400000) / 1000)}:R>`;
}

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
      });

    const dbChannel = getYouTubeChannel(channelId);

    const isDecreasing = (dbChannel?.currentUpdate?.subscriberRate ?? 0) < 0;

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
                dbChannel &&
                dbChannel.currentUpdate &&
                dbChannel.currentUpdate.subscriberRate
                  ? `${gain(dbChannel.currentUpdate.subscriberRate * (60 * 60 * 24), true)}`
                  : "None",
              inline: true,
            },
            {
              name: "Subscribers/second",
              value:
                dbChannel &&
                dbChannel.currentUpdate &&
                dbChannel.currentUpdate.subscriberRate
                  ? `${gain(dbChannel.currentUpdate.subscriberRate)}`
                  : "None",
              inline: true,
            },
            {
              name: `Time until ${abbreviate(calculateNextMilestone(channel.subscribers, isDecreasing))}`,
              value: calculateTimeUntilNextMilestone({
                subscriberCount: channel.subscribers,
                subscriberRate: dbChannel?.currentUpdate?.subscriberRate ?? 0,
                lastUpdated:
                  dbChannel?.currentUpdate?.timeHit ?? new Date().toISOString(),
              }),
            },
            {
              name: `Channels tracking ${channel.name}`,
              value: (dbChannel?.trackers?.length ?? 0).toLocaleString(),
            },
            {
              name: "Created",
              value: time(new Date(channel.createdAt), "F"),
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
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`graph-${channelId}:subscribers`)
            .setLabel("Subscriber graph")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`graph-${channelId}:average`)
            .setLabel("Subscribers/day graph")
            .setStyle(ButtonStyle.Success),
        ),
      ],
    });
  },
} satisfies Command;
