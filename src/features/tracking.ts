import { EmbedBuilder, time } from "discord.js";
import config from "../../config";
import type { BotClient } from "../structures/client";
import { trackers, youtubeChannels } from "../utils/db";
import { getChannels } from "../utils/youtube";
import { abbreviate } from "../utils/abbreviate";

interface Message {
  channelId: string;
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
          const subscriberRate =
            (subscriberDifference / (timeTook / 1000)) * (60 * 60 * 24);

          dbChannel.lastUpdate = dbChannel.currentUpdate;
          dbChannel.currentUpdate = {
            subscribers: channel.subscribers,
            timeHit: currentDate.toISOString(),
            duration: 0,
            subscriberRate,
          };

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
              channelId: trackerData.channelId,
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
        const discordChannel = client.channels.cache.get(message.channelId);
        const title = `New subscriber update for ${message.name}${
          message.handle ? ` (${message.handle})` : ""
        }`;

        if (discordChannel?.isTextBased())
          await discordChannel.send({
            embeds: [
              new EmbedBuilder()
                .setTitle(
                  title.length > 255
                    ? title.substring(0, 255).concat("…")
                    : title,
                )
                .setURL(
                  `https://youtube.com/${message.handle ?? `channel/${message.channelId}`}`,
                )
                .addFields([
                  {
                    name: "Old API Count",
                    value: message.oldApiCount
                      ? abbreviate(message.oldApiCount)
                      : "None",
                    inline: true,
                  },
                  {
                    name: "New API Count",
                    value: abbreviate(message.newApiCount),
                    inline: true,
                  },
                  {
                    name: "Last Update Time",
                    value: message.lastUpdateTime
                      ? time(message.lastUpdateTime, "F")
                      : "None",
                  },
                  {
                    name: "Current Update Time",
                    value: time(message.currentUpdateTime, "F"),
                  },
                  {
                    name: "Exact Time (UTC)",
                    value: message.currentUpdateTime.toISOString(),
                  },
                  {
                    name: "Time Elapsed",
                    value: convertToReadable(message.timeTook),
                  },
                  {
                    name: `Subscribers per day ${
                      message.lastSubscriberRate &&
                      message.lastSubscriberRate !== 0
                        ? message.subscriberRate - message.lastSubscriberRate <
                          0
                          ? "(⬇️)"
                          : message.subscriberRate -
                                message.lastSubscriberRate ===
                              0
                            ? ""
                            : "(⬆️)"
                        : ""
                    }`,
                    value: `${message.subscriberRate === 0 || message.subscriberRate > 0 ? "+" : ""}${Math.floor(message.subscriberRate).toLocaleString()} (previously ${message.lastSubscriberRate ? (message.lastSubscriberRate === 0 || message.lastSubscriberRate > 0 ? "+" : "") : "+"}${Math.floor(message.lastSubscriberRate ?? 0).toLocaleString()})`,
                  },
                ])
                .setThumbnail(message.avatar)
                .setColor(
                  message.newApiCount < (message.oldApiCount ?? 0)
                    ? config.colors.danger
                    : message.subscriberRate < (message.lastSubscriberRate ?? 0)
                      ? config.colors.warning
                      : config.colors.success,
                )
                .setFooter({
                  text: client.user.username,
                  iconURL: client.user.displayAvatarURL(),
                }),
            ],
          });

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
