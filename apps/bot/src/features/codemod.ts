import { cache } from "@/utils/cache";
import { youtubeChannels } from "@/utils/db";
import { getChannel, type YouTubeChannel } from "@/utils/youtube";

export default async () => {
  for (const channel of youtubeChannels) {
    if (!channel.avatar) {
      const cachedChannel = await cache.get(channel.id).catch(() => null);
      let ytChannel = cachedChannel
        ? ((await JSON.parse(cachedChannel)) as YouTubeChannel)
        : null;
      if (!ytChannel) {
        const channelFromYouTube = await getChannel(channel.id);
        ytChannel = channelFromYouTube;
        if (ytChannel) await cache.set(channel.id, JSON.stringify(ytChannel));
      }

      if (ytChannel) channel.avatar = ytChannel.avatar;
    }
  }
};
