import type { BotClient } from "../structures/client";
import { trackers, youtubeChannels } from "../utils/db";
import { getChannels } from "../utils/youtube";

let updatePossible = true;
let lastTrackTime = 0;

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

          dbChannel.lastUpdate = dbChannel.currentUpdate;
          dbChannel.currentUpdate = {
            subscribers: channel.subscribers,
            timeHit: currentDate.toISOString(),
            duration: 0,
            subscriberRate: 0,
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
            const discordChannel = client.channels.cache.get(
              trackerData.channelId,
            );
            if (discordChannel?.isTextBased())
              return discordChannel.send({
                content: `update for ${channel.id}. if you're seeing this, it works!`,
              });
          }
        }
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await Bun.sleep(1000);
    updatePossible = true;
  }
}

export default async (client: BotClient<true>) => {
  setInterval(() => checkForUpdates(client), 1000);
  setInterval(() => {
    if (
      performance.now() - lastTrackTime > 60_000 * 5 + 1000 &&
      updatePossible == false
    ) {
      updatePossible = true; // force save if it gets stuck
      console.log(
        "Tracking was locked for " +
          Math.floor(performance.now() - lastTrackTime) +
          "ms, so we forced it to work again.",
      );
    }
  }, 10000);
};
