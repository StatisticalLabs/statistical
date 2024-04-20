import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "@/structures/command";
import config from "config";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Pings the bot."),
  run: async ({ client, interaction }) => {
    const res = await interaction.deferReply({
      ephemeral: true,
      fetchReply: true,
    });

    const ping = res.createdTimestamp - interaction.createdTimestamp;

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Pong! 🏓")
          .addFields(
            {
              name: "🤖 Bot",
              value: `${ping}ms`,
              inline: true,
            },
            {
              name: "📡 API",
              value: `${client.ws.ping}ms`,
              inline: true,
            },
          )
          .setColor(config.colors.primary),
      ],
    });
  },
} satisfies Command;
