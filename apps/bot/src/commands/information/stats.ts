import type { Command } from "@/structures/command";
import { abbreviate } from "@/utils/abbreviate";
import { youtubeChannels } from "@/utils/db";
import config from "config";
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("View statistics about the bot."),
  run: ({ client, interaction }) => {
    const totalChannels = youtubeChannels.length;
    const totalSubs = youtubeChannels.reduce(
      (acc, channel) => acc + (channel.currentUpdate?.subscribers ?? 0),
      0,
    );

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setAuthor({
            name: client.user.username,
            iconURL: client.user.displayAvatarURL(),
          })
          .setTitle("Statistics")
          .addFields(
            {
              name: "Servers",
              value: client.guilds.cache.size.toLocaleString(),
            },
            {
              name: "Channels tracked",
              value: totalChannels.toLocaleString(),
              inline: true,
            },
            {
              name: "Total subscribers",
              value: abbreviate(totalSubs),
              inline: true,
            },
          )
          .setColor(config.colors.primary),
      ],
    });
  },
} as Command;
