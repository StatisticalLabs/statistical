import { exists, mkdir, writeFile } from "fs/promises";

export interface Meta {
  youtubeChannels: YouTubeChannel[];
  trackers: Tracker[];
}

export interface YouTubeChannel {
  id: string;
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
  channelId: string;
  guildId?: string;
  userId: string;
  subscribedAt: string;
}

async function checkIfDataExists() {
  if (!(await exists("data"))) {
    console.log("No data directory found. Creating data directory...");
    await mkdir("data");
    console.log("Data directory created.");
  }

  if (!(await exists("data/meta.json"))) {
    console.log("No data directory found. Creating data directory...");
    await writeFile(
      "data/meta.json",
      JSON.stringify({
        youtubeChannels: [],
        subscriptions: [],
      }),
    );
    console.log("Data directory created.");
  }
}

await checkIfDataExists();

const metaFile = Bun.file("data/meta.json");
const { youtubeChannels, trackers } = (await JSON.parse(
  Buffer.from(await metaFile.arrayBuffer()).toString(),
)) as Meta;

let updatePossible = true;
let lastSaveTime = 0;
async function refreshFile() {
  if (updatePossible == false) return;
  try {
    const start = performance.now();
    lastSaveTime = start;
    updatePossible = false;
    const data = JSON.stringify({ youtubeChannels, trackers });
    await Bun.write("data/meta.json", data);
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

export { youtubeChannels, trackers };
