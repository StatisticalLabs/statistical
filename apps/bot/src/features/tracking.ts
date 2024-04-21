import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  time,
} from "discord.js";
import config from "config";
import type { BotClient } from "@/structures/client";
import { trackers, youtubeChannels } from "@/utils/db";
import { getChannels } from "@/utils/youtube";
import { abbreviate } from "@/utils/abbreviate";
import { cache } from "@/utils/cache";
import { gain } from "@/utils/gain";
import { readdir, mkdir, appendFile, exists } from "fs/promises";
import { DATA_DIRECTORY } from "@/constants";

interface Message {
  pingRoleId?: string;
  channelId: string;
  youtubeChannelId: string;
  name: string;
  handle?: string;
  avatar: string;
  oldApiCount?: number;
  newApiCount: number;
  lastUpdateTime?: Date;
  currentUpdateTime: Date;
  timeTook: number;
  lastSubscriberRate?: number;
  subscriberRate: number;
}

let updatePossible = true;
let messagePossible = true;
let lastTrackTime = 0;
let lastMessageTime = 0;
let dirExists = false;
const messagesQueue = new Set<Message>();

function convertToReadable(timestamp: number) {
  const pluralize = (word: string, count: number) =>
    count === 1 ? word : `${word}s`;

  const parsed = {
    days: Math.floor(timestamp / 86_400_000),
    hours: Math.floor((timestamp / 3_600_000) % 24),
    minutes: Math.floor((timestamp / 60_000) % 60),
    seconds: Math.floor((timestamp / 1000) % 60),
  };
  const string = [];
  if (parsed.days)
    string.push(`${parsed.days} ${pluralize("day", parsed.days)}`);
  if (parsed.hours)
    string.push(`${parsed.hours} ${pluralize("hour", parsed.hours)}`);
  if (parsed.minutes)
    string.push(`${parsed.minutes} ${pluralize("minute", parsed.minutes)}`);
  if (parsed.seconds)
    string.push(`${parsed.seconds} ${pluralize("second", parsed.seconds)}`);

  if (!string.length) return "0 seconds";

  return string.join(", ");
}

async function checkForUpdates(client: BotClient<true>) {
  if (!updatePossible) return;

  try {
    lastTrackTime = performance.now();
    updatePossible = false;
    let fetchedIds: [string, number][] = [];
    let currentIndex = -1;
    for await (const savedChannels of youtubeChannels) {
      currentIndex++;
      fetchedIds.push([savedChannels.id, currentIndex]);
      if (
        currentIndex === youtubeChannels.length - 1 ||
        fetchedIds.length >= 50
      ) {
        const ids = fetchedIds;
        fetchedIds = [];
        const res = await getChannels(ids.map((c) => c[0]));
        for (const channel of res) {
          const index = ids.find((c) => c[0] === channel.id)?.[1];
          if (index === null || index === undefined) continue;

          const dbChannel = youtubeChannels[index];
          if (
            !dbChannel ||
            channel.subscribers === dbChannel.currentUpdate?.subscribers
          )
            continue;

          const currentDate = new Date();
          const timeTook = !dbChannel.currentUpdate?.timeHit
            ? 0
            : currentDate.getTime() -
              new Date(dbChannel.currentUpdate.timeHit).getTime();
          const subscriberDifference = !dbChannel.currentUpdate?.subscribers
            ? 0
            : channel.subscribers - dbChannel.currentUpdate.subscribers;
          const subscriberRate = subscriberDifference / (timeTook / 1000);

          if (dbChannel.name !== channel.name) dbChannel.name = channel.name;
          if (dbChannel.handle !== channel.handle)
            dbChannel.handle = channel.handle;
          dbChannel.lastUpdate = dbChannel.currentUpdate;
          dbChannel.currentUpdate = {
            subscribers: channel.subscribers,
            timeHit: currentDate.toISOString(),
            duration: 0,
            subscriberRate,
          };
          await cache.set(channel.id, JSON.stringify(channel));

          if (!dirExists) {
            if (!exists(`${DATA_DIRECTORY}/history`))
              await mkdir(`${DATA_DIRECTORY}/history`);
            dirExists = true;
          }

          await appendFile(
            `${DATA_DIRECTORY}/history/${channel.id}.csv`,
            `\n${currentDate.toISOString()},${channel.subscribers},${subscriberRate * (60 * 60 * 24)}`,
          );

          for (const trackerId of dbChannel.trackers) {
            const trackerData = trackers.find(
              (tracker) => tracker.id === trackerId,
            );
            if (!trackerData) continue;

            if (!client.channels.cache.get(trackerData.channelId))
              await client.channels
                .fetch(trackerData.channelId)
                .catch(console.error);

            messagesQueue.add({
              pingRoleId: trackerData.pingRoleId,
              channelId: trackerData.channelId,
              youtubeChannelId: channel.id,
              name: channel.name,
              handle: channel.handle,
              avatar: channel.avatar,
              oldApiCount: dbChannel.lastUpdate?.subscribers,
              newApiCount: channel.subscribers,
              lastUpdateTime: dbChannel.lastUpdate?.timeHit
                ? new Date(dbChannel.lastUpdate?.timeHit)
                : undefined,
              currentUpdateTime: currentDate,
              timeTook,
              lastSubscriberRate: dbChannel.lastUpdate?.subscriberRate,
              subscriberRate,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await Bun.sleep(config.trackDelay);
    updatePossible = true;
  }
}

export default async (client: BotClient<true>) => {
  setInterval(() => checkForUpdates(client), 1000);
  setInterval(async () => {
    if (!messagePossible || !messagesQueue.size) return;
    lastMessageTime = performance.now();
    messagePossible = false;
    try {
      for await (const message of messagesQueue) {
        await client.channels.fetch(message.channelId);
        const discordChannel = client.channels.cache.get(message.channelId);

        const dailySubRate = {
          old: (message.lastSubscriberRate || 0) * (60 * 60 * 24),
          new: message.subscriberRate * (60 * 60 * 24),
        };
        const dailySubRateDifference = dailySubRate.new - dailySubRate.old;
        const secondSubRate = message.subscriberRate * 1;

        if (discordChannel?.isTextBased()) {
          const msg = await discordChannel.send({
            content: message.pingRoleId
              ? `<@&${message.pingRoleId}>`
              : undefined,
            embeds: [
              new EmbedBuilder()
                .setAuthor({
                  name: `${message.name}${message.handle ? ` (${message.handle})` : ""}`,
                  iconURL: message.avatar,
                  url: `https://youtube.com/${message.handle ?? `channel/${message.youtubeChannelId}`}`,
                })
                .setTitle("New subscriber update")
                .addFields([
                  {
                    name: "Old subcriber count",
                    value: message.oldApiCount
                      ? abbreviate(message.oldApiCount)
                      : "None",
                    inline: true,
                  },
                  {
                    name: "New subscriber count",
                    value: abbreviate(message.newApiCount),
                    inline: true,
                  },
                  {
                    name: `${abbreviate(
                      message.oldApiCount ?? 0,
                    )} milestone date`,
                    value: message.lastUpdateTime
                      ? time(message.lastUpdateTime, "F")
                      : "None",
                  },
                  {
                    name: `${abbreviate(message.newApiCount)} milestone date`,
                    value: time(message.currentUpdateTime, "F"),
                  },
                  {
                    name: "Time elapsed",
                    value: convertToReadable(message.timeTook),
                  },
                  {
                    name: `Subscribers/day ${
                      dailySubRate.old !== 0
                        ? dailySubRate.new - dailySubRate.old < 0
                          ? "(⏬)"
                          : dailySubRate.new - dailySubRate.old === 0
                            ? ""
                            : "(⏫)"
                        : ""
                    }`,
                    value: `${gain(dailySubRate.new, true)} (${gain(dailySubRateDifference, true)})`,
                    inline: true,
                  },
                  {
                    name: "Subscribers/second",
                    value: gain(secondSubRate),
                    inline: true,
                  },
                ])
                .setColor(
                  message.newApiCount < (message.oldApiCount ?? 0)
                    ? config.colors.danger
                    : dailySubRate.new < dailySubRate.old
                      ? config.colors.warning
                      : config.colors.success,
                )
                .setImage(`attachment://${message.youtubeChannelId}.png`)
                .setFooter({
                  text: client.user.username,
                  iconURL: client.user.displayAvatarURL(),
                })
                .setTimestamp(),
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId(
                    `image-${message.youtubeChannelId}:${message.currentUpdateTime.getTime()}:${message.timeTook}:${message.oldApiCount ?? 0}:${message.newApiCount}:${dailySubRate.new}`,
                  )
                  .setLabel("Generate image")
                  .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                  .setCustomId(`graph-${message.youtubeChannelId}`)
                  .setLabel("View growth graphs")
                  .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                  .setCustomId(`untrack-${message.youtubeChannelId}`)
                  .setLabel("Stop tracking this channel")
                  .setStyle(ButtonStyle.Danger),
              ),
            ],
          });

          if (msg.crosspostable) await msg.crosspost();
        }

        messagesQueue.delete(message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      messagePossible = true;
    }
  }, 1000);
  setInterval(() => {
    if (
      performance.now() - lastTrackTime > 60_000 * 5 + config.trackDelay &&
      updatePossible == false
    ) {
      updatePossible = true; // force save if it gets stuck
      console.log(
        "Tracking was locked for " +
          Math.floor(performance.now() - lastTrackTime) +
          "ms, so we forced it to work again.",
      );
    }
    if (
      performance.now() - lastMessageTime > 60_000 * 5 + 1000 &&
      messagePossible == false
    ) {
      messagePossible = true; // force save if it gets stuck
      console.log(
        "Message sending was locked for " +
          Math.floor(performance.now() - lastTrackTime) +
          "ms, so we forced it to work again.",
      );
    }
  }, 10000);
};
