import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../../structures/command";
import { getYouTubeChannel, youtubeChannels } from "@/utils/db";
import config from "config";
import { gain } from "@/utils/gain";

export default {
  data: new SlashCommandBuilder()
    .setName("overtake")
    .setDescription(
      "Get information about when two channels will overtake the other.",
    )
    .addStringOption((option) =>
      option
        .setName("channel_1")
        .setDescription("The first channel.")
        .setAutocomplete(true)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("channel_2")
        .setDescription("The second channel.")
        .setAutocomplete(true)
        .setRequired(true),
    ),
  autocomplete: async ({ interaction }) => {
    const focusedOption = interaction.options.getFocused(true);
    let channels = [...youtubeChannels]
      .sort(
        (a, b) =>
          (b.currentUpdate?.subscribers ?? 0) -
          (a.currentUpdate?.subscribers ?? 0),
      )
      .map((channel) => ({
        name: `${channel.name}${channel.handle ? ` (${channel.handle})` : ""}`,
        value: channel.id,
      }));
    if (focusedOption.name === "channel_2") {
      const firstChannelId = interaction.options.getString("channel_1", true);
      channels = channels.filter((channel) => channel.value !== firstChannelId);
    }
    const filtered = channels.filter((channel) =>
      channel.name.includes(focusedOption.value.toLowerCase()),
    );
    await interaction.respond(filtered);
  },
  run: ({ interaction }) => {
    const channelIds = [
      interaction.options.getString("channel_1", true),
      interaction.options.getString("channel_2", true),
    ];
    const [channel1, channel2] = [
      getYouTubeChannel(channelIds[0]),
      getYouTubeChannel(channelIds[1]),
    ].sort(
      (a, b) =>
        (b?.currentUpdate?.subscribers ?? 0) -
        (a?.currentUpdate?.subscribers ?? 0),
    );
    if (!channel1 || !channel1.currentUpdate)
      return interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription(
              `No channel being trackedwith ID **${channelIds[0]}**.`,
            )
            .setColor(config.colors.danger),
        ],
        ephemeral: true,
      });
    if (!channel2 || !channel2.currentUpdate)
      return interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setTitle("Error")
            .setDescription(
              `No channel being tracked with ID **${channelIds[1]}**.`,
            )
            .setColor(config.colors.danger),
        ],
        ephemeral: true,
      });

    if (
      channel2.currentUpdate.subscriberRate <
      channel1.currentUpdate.subscriberRate
    )
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`${channel2.name} can't overtake ${channel1.name}`)
            .setDescription(
              `The channel would need at least more than **${Math.round((channel1.currentUpdate.subscriberRate - channel2.currentUpdate.subscriberRate) * 86400).toLocaleString()}** subscribers/day to be able to pass.`,
            )
            .setColor(config.colors.danger),
        ],
      });

    const channel1Daily = channel1.currentUpdate.subscriberRate * 86400;
    const channel2Daily = channel2.currentUpdate.subscriberRate * 86400;

    const channel1Subs = Math.floor(
      channel1.currentUpdate.subscribers +
        ((Date.now() - new Date(channel1.currentUpdate.timeHit).getTime()) /
          1000) *
          channel1.currentUpdate.subscriberRate,
    );
    const channel2Subs = Math.floor(
      channel2.currentUpdate.subscribers +
        ((Date.now() - new Date(channel2.currentUpdate.timeHit).getTime()) /
          1000) *
          channel2.currentUpdate.subscriberRate,
    );
    const subGap = channel1Subs - channel2Subs;

    let untilOvertakeTime =
      (Math.abs(subGap) / (channel2Daily - channel1Daily)) * 86400000;
    let untilOvertakeSubs = Math.floor(
      ((channel1Daily / 86400000) * untilOvertakeTime +
        (channel2Daily / 86400000) * untilOvertakeTime) /
        2,
    );

    untilOvertakeTime = untilOvertakeTime * Math.sign(subGap);
    untilOvertakeSubs = untilOvertakeSubs * Math.sign(subGap);

    const overtakeTime = Date.now() + untilOvertakeTime;
    const overtakeSubs = Math.floor(
      (channel1Subs + untilOvertakeSubs + (channel2Subs + untilOvertakeSubs)) /
        2,
    );

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`${channel2.name} vs ${channel1.name}`)
          .setDescription(
            `**${channel2.name}** ${subGap >= 0 ? "will overtake" : "has overtaken"} **${channel1.name}** <t:${Math.floor(overtakeTime / 1000)}:R> at ${overtakeSubs.toLocaleString()} subscribers, if previous rates of both channels hold.`,
          )
          .addFields(
            {
              name: channel1.name,
              value: `${Math.floor(channel1Subs).toLocaleString()} (${gain(channel1Daily, true)}/day)`,
              inline: true,
            },
            {
              name: channel2.name,
              value: `${Math.floor(channel2Subs).toLocaleString()} (${gain(channel2Daily, true)}/day)`,
              inline: true,
            },
            {
              name: "Current subscriber gap",
              value: `${Math.floor(subGap).toLocaleString()} (${gain(channel1Daily - channel2Daily, true)}/day)`,
            },
          )
          .setColor(config.colors.primary)
          .setFooter({
            text: "Note: These estimations do not account for overestimations.",
          }),
      ],
    });
  },
} satisfies Command;
