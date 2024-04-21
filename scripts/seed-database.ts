import { exists, mkdir, writeFile } from "fs/promises";

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
  channelId: string;
  guildId: string;
  userId: string;
  subscribedAt: string;
  pingRoleId?: string;
}

const DATA_DIRECTORY = "./data";

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

interface NiaChannel {
  channel_id: string;
  subscribers: string;
  views: string;
  videos: string;
  subscriber_hit: string;
  sub_rate: string;
  highest_subs: string;
  row_added_at: string;
  yt: {
    channelId: string;
    title: string;
    thumbnailDetails: {
      thumbnails: {
        url: string;
        width: number;
        height: number;
      }[];
    };
    metric: {
      subscriberCount: string;
      videoCount: string;
      totalVideoViewCount: string;
    };
    timeCreatedSeconds: string;
    isNameVerified: boolean;
    channelHandle: string;
  };
}

interface NiaDatapoint {
  date: string;
  subscribers: string | number;
  views: string | number;
  videos: string | number;
  deleteThis?: true;
}

type FormattedUpdate = (NiaDatapoint & {
  subscriberRate: number;
})[];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  await checkIfDataExists();

  const metaFile = Bun.file(`${DATA_DIRECTORY}/meta.json`);
  const { youtubeChannels, trackers } = (await JSON.parse(
    Buffer.from(await metaFile.arrayBuffer()).toString(),
  )) as Meta;

  console.log("Fetching channels...");

  console.time("Fetched channels");
  const channels: NiaChannel[] = await fetch(
    "https://youtubecrap.nia-statistics.com/toplists/subscribers",
  )
    .then((res) => res.json())
    .then((data) => data.data);
  console.timeEnd("Fetched channels");

  for (const channel of channels) {
    const dbChannel = youtubeChannels.find((c) => c.id === channel.channel_id);
    if (!dbChannel)
      youtubeChannels.push({
        id: channel.channel_id,
        name: channel.yt.title,
        handle: channel.yt.channelHandle,
        avatar:
          channel.yt.thumbnailDetails.thumbnails[2].url ??
          channel.yt.thumbnailDetails.thumbnails[1].url ??
          channel.yt.thumbnailDetails.thumbnails[0].url,
        trackers: [],
        currentUpdate: {
          subscribers: parseInt(channel.subscribers.toString()),
          timeHit: channel.subscriber_hit,
          duration: 0,
          subscriberRate:
            parseInt(channel.sub_rate.toString()) / (60 * 60 * 24),
        },
      });
    else {
      dbChannel.currentUpdate = {
        subscribers: parseInt(channel.subscribers.toString()),
        timeHit: channel.subscriber_hit,
        duration: 0,
        subscriberRate: parseInt(channel.sub_rate.toString()) / (60 * 60 * 24),
      };
    }

    if (await exists(`${DATA_DIRECTORY}/history/${channel.channel_id}.csv`))
      continue;

    console.log(`Fetching analytics for ${channel.yt.title}...`);

    console.time(`Fetched analytics for ${channel.yt.title}`);
    let analytics: NiaDatapoint[] = await fetch(
      `https://analytics.nia-statistics.com/raw/${channel.channel_id}`,
    )
      .then((res) => res.json())
      .then((data) => data.data);
    console.timeEnd(`Fetched analytics for ${channel.yt.title}`);

    console.log(`Saving analytics for ${channel.yt.title}...`);

    console.time(`Saved analytics for ${channel.yt.title}`);

    analytics.splice(0, 1);
    analytics = analytics.filter((datapoint) => !datapoint.deleteThis);

    const analyticsWithGains = analytics
      .reduce((arr, data) => {
        const newData = data as FormattedUpdate[number];
        const last = arr[arr.length - 1];
        if (!last) {
          newData.subscriberRate = 0;
        } else {
          const timeTook =
            new Date(data.date).getTime() - new Date(last.date).getTime();
          const subscriberDifference =
            parseInt(data.subscribers.toString()) -
            parseInt(last.subscribers.toString());
          const subscriberRate = subscriberDifference / (timeTook / 1000);
          newData.subscriberRate = subscriberRate * (60 * 60 * 24);
        }
        arr.push(newData);
        return arr;
      }, [] as FormattedUpdate)
      .filter((datapoint) => datapoint.subscriberRate !== 0);

    await Bun.write(
      `${DATA_DIRECTORY}/history/${channel.channel_id}.csv`,
      `\n${analyticsWithGains.map((a) => `${a.date},${a.subscribers},${a.subscriberRate}`).join("\n")}`,
    );

    console.timeEnd(`Saved analytics for ${channel.yt.title}`);

    await sleep(1000);
  }

  console.log("Saving meta.json...");

  console.time("Saved meta.json");
  const data = JSON.stringify({ youtubeChannels, trackers });
  await Bun.write(`${DATA_DIRECTORY}/meta.json`, data);
  console.timeEnd("Saved meta.json");
}

main();
