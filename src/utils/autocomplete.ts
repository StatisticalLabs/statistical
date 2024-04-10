import type { AutocompleteInteraction } from "discord.js";
import { cache } from "./cache";
import { getYouTubeChannel, trackers, type YouTubeChannel } from "./db";

export const channelAutocomplete = async (
  interaction: AutocompleteInteraction,
) => {
  const focusedValue = interaction.options.getFocused() || "mrbeast";

  const cachedSearchResults = await cache.get(
    "search_" + focusedValue.toLowerCase().replace(/ /g, "_"),
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
  await cache.set(
    "search_" + focusedValue.toLowerCase().replace(/ /g, "_"),
    JSON.stringify(channels),
  );
  await interaction.respond(channels);
};

export const trackedChannelAutocomplete = async (
  interaction: AutocompleteInteraction,
) => {
  const focusedValue = interaction.options.getFocused();
  const channels = trackers
    .filter((tracker) => tracker.channelId === interaction.channelId)
    .map((tracker) => getYouTubeChannel(tracker.youtubeChannelId))
    .filter((channel): channel is YouTubeChannel => !!channel)
    .sort(
      (a, b) =>
        (b.currentUpdate?.subscribers ?? 0) -
        (a.currentUpdate?.subscribers ?? 0),
    )
    .map((channel) => ({
      name: `${channel.name}${channel.handle ? ` (${channel.handle})` : ""}`,
      value: channel.id,
    }));
  const filtered = channels.filter((channel) =>
    channel.name.includes(focusedValue),
  );
  await interaction.respond(filtered);
};
