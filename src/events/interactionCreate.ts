import { AutocompleteInteraction, EmbedBuilder } from "discord.js";
import { event } from "../structures/event";
import type { ExtendedChatInputCommandInteraction } from "../structures/command";
import config from "../../config";

export default event("interactionCreate", async (client, interaction) => {
  if (interaction.isChatInputCommand()) {
    if (!interaction.inGuild())
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription("Commands can only be used in servers.")
            .setColor(config.colors.danger),
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
            .setColor(config.colors.danger),
        ],
        ephemeral: true,
      });
    }
  } else if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command || !command.autocomplete) return;

    try {
      await command.autocomplete({
        client,
        interaction: interaction as AutocompleteInteraction<"cached">,
      });
    } catch (err) {
      console.error(err);
    }
  }
});
