import { EmbedBuilder } from "discord.js";
import { event } from "../structures/event";
import type { ExtendedChatInputCommandInteraction } from "../structures/command";

export default event("interactionCreate", async (client, interaction) => {
  if (interaction.isChatInputCommand()) {
    if (!interaction.inGuild())
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Commands can only be used in servers.")
            .setColor("Red"),
        ],
        ephemeral: true,
      });

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.run({
        client,
        interaction: interaction as ExtendedChatInputCommandInteraction,
      });
    } catch (err) {
      console.error(err);
      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription("An error occured while running this command.")
            .setColor("Red"),
        ],
        ephemeral: true,
      });
    }
  }
});
