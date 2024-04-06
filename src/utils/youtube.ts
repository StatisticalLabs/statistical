export async function getChannels(
  ids: string[],
): Promise<
  { id: string; name: string; avatar: string; subscribers: number }[]
> {
  const res = await fetch(
    `https://yt.lemnoslife.com/noKey/channels?id=${ids.join(",")}&part=snippet,statistics`,
  );
  if (!res.ok)
    throw new Error(
      "An error occured while fetching these channels: " + ids.join(", "),
    );

  const data: any = await res.json();

  return [
    ...data.items.map((item: any) => ({
      id: item.id,
      name: item.snippet.title,
      avatar:
        item.snippet.thumbnails.high?.url ??
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url,
      subscribers: parseInt(item.statistics.subscriberCount),
    })),
  ];
}
