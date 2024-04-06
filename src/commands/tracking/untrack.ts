import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../structures/command";
import { channelAutocomplete } from "../../utils/autocomplete";
import { getChannel } from "../../utils/youtube";
import config from "../../../config";
import { isTracking, unsubscribe } from "../../utils/db";

export default {
  data: new SlashCommandBuilder()
    .setName("untrack")
    .setDescription("Stop tracking a YouTube channel.")
    .addStringOption((option) =>
      option
        .setName("channel")
        .setDescription("The YouTube channel to stop tracking.")
        .setAutocomplete(true)
        .setRequired(true),
    ),
  autocomplete: ({ interaction }) => channelAutocomplete(interaction),
  run: async ({ interaction }) => {
    const channelId = interaction.options.getString("channel", true);
    const channel = await getChannel(channelId);

    if (!isTracking(channelId, interaction.channel.id))
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription(
              `${channel?.name ? `**${channel.name}**` : "The YouTube channel you specified"} is not being tracked in this channel.`,
            )
            .setColor(config.colors.danger),
        ],
        ephemeral: true,
      });

    unsubscribe({
      youtubeChannelId: channelId,
      channelId: interaction.channel.id,
    });

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Success!")
          .setDescription(
            `Stopped tracking ${channel?.name ? `**${channel.name}**` : "the YouTube channel you specified"} in this channel.`,
          )
          .setColor(config.colors.success),
      ],
      ephemeral: true,
    });
    if (channel)
      interaction.channel.send(
        `${interaction.user} has stopped tracking **${channel.name}** in this channel.`,
      );
  },
} satisfies Command;
