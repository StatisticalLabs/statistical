import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import type { Command } from "../../structures/command";
import { trackers, youtubeChannels, type YouTubeChannel } from "../../utils/db";
import config from "../../../config";
import { abbreviate } from "../../utils/abbreviate";

export default {
  data: new SlashCommandBuilder()
    .setName("tracking")
    .setDescription(
      "View the list of YouTube channels currently being tracked.",
    ),
  run: async ({ interaction }) => {
    const channelTrackers = trackers.filter(
      (tracker) => tracker.channelId === interaction.channel.id,
    );
    if (!channelTrackers.length)
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription(
              "No YouTube channels are being tracked in this channel.",
            )
            .setColor(config.colors.danger),
        ],
        ephemeral: true,
      });

    const channels = trackers
      .map((tracker) =>
        youtubeChannels.find(
          (channel) => channel.id === tracker.youtubeChannelId,
        ),
      )
      .filter((channel): channel is YouTubeChannel => !!channel)
      .sort(
        (a, b) =>
          (b.currentUpdate?.subscribers ?? 0) -
          (a.currentUpdate?.subscribers ?? 0),
      );

    const embeds: EmbedBuilder[] = [];
    for (let i = 0; i < channels.length; i += 10) {
      const chnls = channels;
      const current = chnls.slice(i, i + 10);
      embeds.push(
        new EmbedBuilder()
          .setTitle(`Channels being tracked in #${interaction.channel.name}`)
          .setDescription(
            current
              .map(
                (channel, index) =>
                  `**${index + 1}**. [${channel.name}${channel.handle ? ` (${channel.handle})` : ""}](https://youtube.com/${channel.handle ?? `channel/${channel.id}`}) • ${abbreviate(channel.currentUpdate?.subscribers ?? 0)} subscribers`,
              )
              .join("\n"),
          )
          .setFooter({
            text: `Page ${Math.floor(i / 10) + 1}/${Math.ceil(
              channels.length / 10,
            )} • Total: ${channels.length}`,
            iconURL: interaction.guild.iconURL() ?? "",
          })
          .setColor(config.colors.primary),
      );
    }

    const getRow = (cur: number) =>
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(config.emojis.previous)
          .setDisabled(cur === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(config.emojis.next)
          .setDisabled(cur === embeds.length - 1),
      );

    let cur = 0;
    const res = await interaction.reply({
      embeds: [embeds[0]],
      components: [getRow(cur)],
      fetchReply: true,
    });

    const filter = (i: ButtonInteraction<"cached">) =>
      i.user.id === interaction.user.id &&
      ["prev", "next"].includes(i.customId);
    const collector = res.createMessageComponentCollector({
      filter,
      componentType: ComponentType.Button,
    });

    collector.on("collect", (i) => {
      if (i.customId === "prev" && cur > 0) {
        cur -= 1;
        i.update({
          embeds: [embeds[cur]],
          components: [getRow(cur)],
        });
      } else if (i.customId === "next" && cur < embeds.length - 1) {
        cur += 1;
        i.update({
          embeds: [embeds[cur]],
          components: [getRow(cur)],
        });
      }
    });
  },
} satisfies Command;
