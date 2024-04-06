import type { AutocompleteInteraction } from "discord.js";
import { cache } from "./cache";

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
