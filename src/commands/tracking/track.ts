import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../structures/command";
import { channelAutocomplete } from "../../utils/autocomplete";
import { getChannel } from "../../utils/youtube";
import { isTracking, subscribe } from "../../utils/db";

export default {
  data: new SlashCommandBuilder()
    .setName("track")
    .setDescription(
      "Track a YouTube channel's latest updates in a Discord channel.",
    )
    .addStringOption((option) =>
      option
        .setName("channel")
        .setDescription("The YouTube channel to track.")
        .setAutocomplete(true)
        .setRequired(true),
    ),
  autocomplete: ({ interaction }) => channelAutocomplete(interaction),
  run: async ({ interaction }) => {
    const channelId = interaction.options.getString("channel", true);
    const channel = await getChannel(channelId);
    if (!channel)
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription(`No channel found with ID **${channelId}**.`)
            .setColor("Red"),
        ],
        ephemeral: true,
      });

    if (isTracking(channelId, interaction.channel.id))
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription(
              `**${channel.name}** is already being tracked in this channel.`,
            )
            .setColor("Red"),
        ],
        ephemeral: true,
      });

    subscribe({
      youtubeChannelId: channelId,
      channelId: interaction.channel.id,
      userId: interaction.user.id,
      guildId: interaction.guild.id,
    });

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Success!")
          .setDescription(
            `Started tracking **${channel.name}** in this channel.`,
          )
          .setColor("Green"),
      ],
      ephemeral: true,
    });
    interaction.channel.send(
      `${interaction.user} has started tracking **${channel.name}** in this channel.`,
    );
  },
} satisfies Command;
