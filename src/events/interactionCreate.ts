import { AutocompleteInteraction, EmbedBuilder, GuildMember } from "discord.js";
import { event } from "../structures/event";
import type { ExtendedChatInputCommandInteraction } from "../structures/command";
import config from "../../config";
import { cache } from "../utils/cache";
import { getChannel, type YouTubeChannel } from "../utils/youtube";
import { isTracking, unsubscribe } from "../utils/db";

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
  } else if (interaction.isButton()) {
    if (interaction.customId.startsWith("untrack-")) {
      await interaction.deferReply({
        ephemeral: true,
      });

      if (!(interaction.member as GuildMember).permissions.has("ManageGuild"))
        return interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setDescription("You don't have permission to unwatch channels.")
              .setColor("Red"),
          ],
        });

      const channelId = interaction.customId.split("untrack-")[1];

      const cachedChannel = await cache.get(channelId).catch(() => null);
      let channel = cachedChannel
        ? ((await JSON.parse(cachedChannel)) as YouTubeChannel)
        : null;
      if (!channel) {
        const channelFromYouTube = await getChannel(channelId);
        channel = channelFromYouTube;
        if (channel) await cache.set(channelId, JSON.stringify(channel));
      }

      if (!isTracking(channelId, interaction.channelId))
        return interaction.followUp({
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
        channelId: interaction.channelId,
      });

      interaction.followUp({
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
        interaction.channel!.send(
          `${interaction.user} has stopped tracking **${channel.name}** in this channel.`,
        );
    }
  }
});
