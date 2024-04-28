import { exists, mkdir, writeFile } from "fs/promises";
import { createId } from "@paralleldrive/cuid2";
import { DATA_DIRECTORY } from "@/constants";

export interface Meta {
  youtubeChannels: YouTubeChannel[];
  trackers: Tracker[];
}

export interface YouTubeChannel {
  id: string;
  name: string;
  handle?: string;
  avatar: string;
  lastUpdate?: Update;
  currentUpdate?: Update;
  trackers: string[];
}

export interface Update {
  subscribers: number;
  timeHit: string;
  duration: number;
  subscriberRate: number;
}

export interface Tracker {
  id: string;
  youtubeChannelId: string;
  channelId?: string;
  guildId: string;
  userId: string;
  subscribedAt: string;
  pingRoleId?: string;
}

async function checkIfDataExists() {
  if (!(await exists(DATA_DIRECTORY))) {
    console.log("No data directory found. Creating data directory...");
    await mkdir(DATA_DIRECTORY);
    console.log("Data directory created.");
  }

  if (!(await exists(`${DATA_DIRECTORY}/meta.json`))) {
    console.log("No meta.json found. Creating meta.json...");
    await writeFile(
      `${DATA_DIRECTORY}/meta.json`,
      JSON.stringify({
        youtubeChannels: [],
        trackers: [],
      }),
    );
    console.log("meta.json created.");
  }
}

await checkIfDataExists();

const metaFile = Bun.file(`${DATA_DIRECTORY}/meta.json`);
const { youtubeChannels, trackers } = (await JSON.parse(
  Buffer.from(await metaFile.arrayBuffer()).toString(),
)) as Meta;

const getYouTubeChannel = (id: string) =>
  youtubeChannels.find((record) => record.id === id);
const getYouTubeChannelIndex = (id: string) =>
  youtubeChannels.findIndex((record) => record.id === id);

const isTracking = (
  youtubeChannelId: string,
  channelOrUserId: string,
  user: boolean = false,
) =>
  trackers?.findIndex(
    (record) =>
      (user
        ? record.userId === channelOrUserId
        : record?.channelId === channelOrUserId) &&
      record?.youtubeChannelId === youtubeChannelId,
  ) !== -1;

const isTrackingAny = (channelOrUserId: string, user: boolean = false) =>
  trackers?.findIndex(
    (record) =>
      (user
        ? record.userId === channelOrUserId
        : record?.channelId === channelOrUserId) && record?.youtubeChannelId,
  ) !== -1;

function findTracker(
  youtubeChannelId: string,
  channelOrUserId: string,
  user: boolean = false,
) {
  return trackers.find(
    (record) =>
      (user
        ? record.userId === channelOrUserId
        : record?.channelId === channelOrUserId) &&
      record.youtubeChannelId === youtubeChannelId,
  );
}

function filterData(
  datapoints: { timeHit: Date; subscribers: number; subscriberRate: number }[],
) {
  const filteredDatapoints = [];
  const seenSubscriberCounts = new Map();
  for (let i = 0; i < datapoints.length; i++) {
    const currentSubscribers = datapoints[i].subscribers;
    const currentSubscriberRate = datapoints[i].subscriberRate;
    if (!seenSubscriberCounts.has(currentSubscribers)) {
      filteredDatapoints.push(datapoints[i]);
      seenSubscriberCounts.set(currentSubscribers, currentSubscriberRate);
    } else {
      datapoints[i].subscriberRate =
        seenSubscriberCounts.get(currentSubscribers);
    }
  }
  return filteredDatapoints;
}

async function getPreviousUpdates(channelId: string) {
  const previousUpdatesFile = Bun.file(
    `${DATA_DIRECTORY}/history/${channelId}.csv`,
  );
  if (previousUpdatesFile.size === 0) return [];
  else {
    const lines = (await previousUpdatesFile.text()).split("\n");
    lines.splice(0, 1);
    const datapoints = lines
      .map((line) => {
        const [date, subscribers, average] = line.split(",");
        return {
          timeHit: new Date(date),
          subscribers: parseFloat(subscribers),
          subscriberRate: parseFloat(average),
        };
      })
      .filter(
        ({ timeHit: date, subscribers, subscriberRate: average }) =>
          !isNaN(date.getTime()) && !isNaN(subscribers) && !isNaN(average),
      );
    return filterData(datapoints);
  }
}

function subscribe(options: {
  name: string;
  handle?: string;
  avatar: string;
  youtubeChannelId: string;
  channelId?: string;
  userId: string;
  guildId: string;
  pingRoleId?: string;
}) {
  if (
    isTracking(
      options.youtubeChannelId,
      options.channelId ?? options.userId,
      !options.channelId,
    )
  )
    return false;

  const id = createId();

  const channelIndex = getYouTubeChannelIndex(options.youtubeChannelId);
  if (channelIndex === -1)
    youtubeChannels.push({
      id: options.youtubeChannelId,
      name: options.name,
      handle: options.handle,
      avatar: options.avatar,
      trackers: [id],
    });
  else youtubeChannels[channelIndex].trackers.push(id);

  trackers.push({
    id,
    youtubeChannelId: options.youtubeChannelId,
    channelId: options.channelId,
    guildId: options.guildId,
    userId: options.userId,
    subscribedAt: new Date().toISOString(),
    pingRoleId: options.pingRoleId,
  });
}

function unsubscribe(
  options: {
    youtubeChannelId: string;
  } & ({ channelId: string } | { userId: string }),
) {
  if (
    !isTracking(
      options.youtubeChannelId,
      "channelId" in options ? options.channelId : options.userId,
      !("channelId" in options),
    )
  )
    return false;

  const index = getYouTubeChannelIndex(options.youtubeChannelId);
  if (index === -1) return false;
  const tracker = findTracker(
    options.youtubeChannelId,
    "channelId" in options ? options.channelId : options.userId,
    !("channelId" in options),
  );
  if (!tracker?.id) return false;
  const trackerInChannelIndex = youtubeChannels[index].trackers.findIndex(
    (record) => record == tracker.id,
  );
  const trackerIndex = trackers.findIndex((record) => record.id == tracker.id);
  if (trackerInChannelIndex !== -1)
    // remove the subscription
    youtubeChannels[index].trackers.splice(trackerInChannelIndex, 1);
  if (trackerIndex != -1) trackers.splice(trackerIndex, 1);
  return true;
}

function unsubscribeAll(channelOrUserId: string, user: boolean = false) {
  const allTrackers = trackers.filter((record) =>
    user
      ? record.userId === channelOrUserId
      : record.channelId === channelOrUserId,
  );
  if (!allTrackers.length) return false;
  for (const tracker of allTrackers) {
    unsubscribe({
      youtubeChannelId: tracker.youtubeChannelId,
      channelId: tracker.channelId,
      userId: tracker.userId,
    });
  }
  return true;
}

let updatePossible = true;
let lastSaveTime = 0;
async function refreshFile() {
  if (updatePossible == false) return;
  try {
    const start = performance.now();
    lastSaveTime = start;
    updatePossible = false;
    const data = JSON.stringify({ youtubeChannels, trackers });
    await Bun.write(`${DATA_DIRECTORY}/meta.json`, data);
  } catch (err) {
    console.error(err);
  } finally {
    updatePossible = true; // allow saving again
  }
}

setInterval(refreshFile, 10000); // save it every 10 seconds, it will not save if something is already saving it.
setInterval(() => {
  if (
    performance.now() - lastSaveTime > 60_000 * 5 &&
    updatePossible == false
  ) {
    updatePossible = true; // force save if it gets stuck
    console.log(
      "Saving was locked for " +
        Math.floor(performance.now() - lastSaveTime) +
        "ms, so we forced it to work again.",
    );
  }
}, 10000);

export {
  youtubeChannels,
  trackers,
  getYouTubeChannel,
  getYouTubeChannelIndex,
  getPreviousUpdates,
  isTracking,
  isTrackingAny,
  subscribe,
  unsubscribe,
  unsubscribeAll,
};
