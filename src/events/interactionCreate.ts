import {
  ActionRowBuilder,
  AttachmentBuilder,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  GuildMember,
} from "discord.js";
import { event } from "@/structures/event";
import type { ExtendedChatInputCommandInteraction } from "@/structures/command";
import config from "config";
import { cache } from "@/utils/cache";
import { getChannel, type YouTubeChannel } from "@/utils/youtube";
import { getYouTubeChannel, isTracking, unsubscribe } from "@/utils/db";
import { generateUpdateImage } from "@/utils/image";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { Chart, registerables } from "chart.js";
import "chartjs-adapter-date-fns";
import { graphConfiguration } from "@/utils/graph";
import { createId } from "@paralleldrive/cuid2";

Chart.register(...registerables);

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
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("Error")
              .setDescription("This channel is not being tracked.")
              .setColor(config.colors.danger),
          ],
          ephemeral: true,
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

      const row = new ActionRowBuilder<ButtonBuilder>(
        interaction.message.components[0].toJSON(),
      );
      row.components.splice(0, 1);

      interaction.update({
        embeds: [
          new EmbedBuilder(interaction.message.embeds[0].toJSON()).setImage(
            `attachment://${attachment.name}`,
          ),
        ],
        components: [row],
        files: [attachment],
      });
    } else if (interaction.customId.startsWith("graph-")) {
      await interaction.deferReply({
        ephemeral: true,
      });

      const [channelId, type] = interaction.customId
        .split("graph-")[1]
        .split(":");

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

      const previousUpdatesFile = Bun.file(`data/history/${channelId}.csv`);
      if (previousUpdatesFile.size === 0)
        return interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setTitle("Error")
              .setDescription(`**${channel.name}** is not being tracked.`)
              .setColor(config.colors.danger),
          ],
        });
      const lines = (await previousUpdatesFile.text()).split("\n");
      lines.splice(0, 1);
      const previousUpdates = lines.map((line) => {
        const [date, subscribers, average] = line.split(",");
        return [new Date(date), parseInt(subscribers), parseInt(average)];
      }) as [Date, number, number][];

      switch (type) {
        default:
          {
            interaction.followUp({
              content: "Select a graph type:",
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
              ephemeral: true,
            });
          }
          break;
        case "subscribers":
          {
            const canvas = createCanvas(800, 600);
            const ctx = canvas.getContext("2d");

            const avatar = await loadImage(channel.avatar);

            ctx.drawImage(avatar, -100, -100, 280, 280);
            const { data: avatarData } = ctx.getImageData(-100, -100, 280, 280);

            const chart = new Chart(
              ctx,
              graphConfiguration(`Subscribers for ${channel.name}`, {
                labels: previousUpdates.map(([date]) => date),
                datasets: [
                  {
                    label: channel.name,
                    data: previousUpdates.map(([, subscribers]) => subscribers),
                    backgroundColor: `rgb(${avatarData[0]}, ${avatarData[1]}, ${avatarData[2]})`,
                    borderColor: `rgb(${avatarData[0]}, ${avatarData[1]}, ${avatarData[2]})`,
                    tension: 0.1,
                    pointRadius: 2.4,
                  },
                ],
              }),
            );

            chart.draw();

            const attachment = new AttachmentBuilder(
              await canvas.encode("png"),
              {
                name: `subscribers-graph-${createId()}.png`,
              },
            );

            interaction.followUp({
              files: [attachment],
            });
          }
          break;
        case "average":
          {
            const canvas = createCanvas(800, 600);
            const ctx = canvas.getContext("2d");

            const avatar = await loadImage(channel.avatar);

            ctx.drawImage(avatar, -100, -100, 280, 280);
            const { data: avatarData } = ctx.getImageData(-100, -100, 280, 280);

            const chart = new Chart(
              ctx,
              graphConfiguration(`Subscribers/day for ${channel.name}`, {
                labels: previousUpdates.map(([date]) => date),
                datasets: [
                  {
                    label: channel.name,
                    data: previousUpdates.map(([, , average]) => average),
                    backgroundColor: `rgb(${avatarData[0]}, ${avatarData[1]}, ${avatarData[2]})`,
                    borderColor: `rgb(${avatarData[0]}, ${avatarData[1]}, ${avatarData[2]})`,
                    tension: 0.1,
                    pointRadius: 2.4,
                  },
                ],
              }),
            );

            chart.draw();

            const attachment = new AttachmentBuilder(
              await canvas.encode("png"),
              {
                name: `average-graph-${createId()}.png`,
              },
            );

            interaction.followUp({
              files: [attachment],
            });
          }
          break;
      }
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
