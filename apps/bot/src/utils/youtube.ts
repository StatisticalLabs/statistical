interface Channel {
  id: string;
  name: string;
  handle?: string;
  avatar: string;
  subscribers: number;
  views: number;
  videos: number;
  createdAt: string;
}

export type { Channel as YouTubeChannel };

export async function getChannel(id: string) {
  const res = await fetch(
    `https://yt.lemnoslife.com/noKey/channels?id=${id}&part=snippet,statistics`,
  );
  if (!res.ok) throw new Error("An error occured while fetching " + id);
  const data: any = await res.json();
  if (!data.items?.length) return null;
  return formatItem(data.items[0]);
}

export async function getChannels(ids: string[]): Promise<Channel[]> {
  const res = await fetch(
    `https://yt.lemnoslife.com/noKey/channels?id=${ids.join(",")}&part=snippet,statistics`,
  );
  if (!res.ok)
    throw new Error(
      "An error occured while fetching these channels: " + ids.join(", "),
    );
  const data: any = await res.json();
  return [...data.items.map(formatItem)];
}

const formatItem = (item: any): Channel => ({
  id: item.id,
  name: item.snippet.title,
  handle: item.snippet.customUrl,
  avatar:
    item.snippet.thumbnails.high?.url ??
    item.snippet.thumbnails.medium?.url ??
    item.snippet.thumbnails.default?.url,
  subscribers: parseInt(item.statistics.subscriberCount),
  views: parseInt(item.statistics.viewCount),
  videos: parseInt(item.statistics.videoCount),
  createdAt: item.snippet.publishedAt,
});
