import type { AutocompleteInteraction } from "discord.js";
import { cache } from "./cache";
import { trackers, youtubeChannels, type YouTubeChannel } from "./db";

export const channelAutocomplete = async (
  interaction: AutocompleteInteraction,
) => {
  const focusedValue = interaction.options.getFocused() || "mrbeast";

  const cachedSearchResults = await cache.get(
    "search_" + focusedValue.toLowerCase(),
  );
  if (cachedSearchResults) {
    await interaction.respond(await JSON.parse(cachedSearchResults));
    return;
  }

  const res = await fetch(
    `https://axern.space/api/search?platform=youtube&type=channel&query=${focusedValue}`,
  );
  const data: any = await res.json();

  const channels = data.map((channel: any) => ({
    name: `${channel.name} (${channel.username})`,
    value: channel.id,
  }));
  await cache.set("search_" + focusedValue, JSON.stringify(channels));
  await interaction.respond(channels);
};

export const trackedChannelAutocomplete = async (
  interaction: AutocompleteInteraction,
) => {
  const focusedValue = interaction.options.getFocused();
  const channels = trackers
    .filter((tracker) => tracker.channelId === interaction.channelId)
    .map((tracker) =>
      youtubeChannels.find(
        (channel) => channel.id === tracker.youtubeChannelId,
      ),
    )
    .filter((channel): channel is YouTubeChannel => !!channel)
    .sort(
      (a, b) =>
        (b.currentUpdate?.subscribers ?? 0) -
        (a.currentUpdate?.subscribers ?? 0),
    )
    .map((channel) => ({
      name: `${channel.name}${channel.handle ? ` (${channel.handle})` : `channel/${channel.id}`}`,
      value: channel.id,
    }));
  console.log(channels);
  const filtered = channels.filter((channel) =>
    channel.name.includes(focusedValue),
  );
  await interaction.respond(filtered);
};
