import { AutocompleteInteraction, EmbedBuilder, GuildMember } from "discord.js";
import { event } from "../structures/event";
import type { ExtendedChatInputCommandInteraction } from "../structures/command";
import config from "../../config";
import { cache } from "../utils/cache";
import { getChannel, type YouTubeChannel } from "../utils/youtube";
import { getYouTubeChannel, isTracking, unsubscribe } from "../utils/db";
import { generateUpdateImage } from "../utils/image";

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
    if (interaction.customId.startsWith("image-")) {
      await interaction.deferReply();

      let [
        channelId,
        updateTimeAsNumber,
        timeTook,
        lastCount,
        subCount,
        dailyAVG,
      ] = interaction.customId.split("image-")[1].split(":");
      const updateTime = new Date(parseInt(updateTimeAsNumber));

      const cachedChannel = await cache.get(channelId).catch(() => null);
      let channel = cachedChannel
        ? ((await JSON.parse(cachedChannel)) as YouTubeChannel)
        : null;
      if (!channel) {
        const channelFromYouTube = await getChannel(channelId);
        channel = channelFromYouTube;
        if (channel) await cache.set(channelId, JSON.stringify(channel));
      }

      const dbChannel = getYouTubeChannel(channelId);
      if (
        !channel ||
        !dbChannel ||
        !dbChannel.currentUpdate ||
        !dbChannel.lastUpdate
      )
        return interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setTitle("Error")
              .setDescription("This channel is not being tracked.")
              .setColor(config.colors.danger),
          ],
        });

      const attachment = await generateUpdateImage({
        youtubeChannelId: channelId,
        name: channel.name,
        handle: channel.handle,
        avatar: channel.avatar,
        lastCount: parseInt(lastCount),
        subCount: parseInt(subCount),
        dailyAVG: parseInt(dailyAVG),
        updateTime,
        timeTook: parseInt(timeTook),
      });

      interaction.followUp({
        files: [attachment],
      });
    } else if (interaction.customId.startsWith("untrack-")) {
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
