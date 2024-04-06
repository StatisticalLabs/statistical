import type { AutocompleteInteraction } from "discord.js";

export const channelAutocomplete = async (
  interaction: AutocompleteInteraction,
) => {
  const focusedValue = interaction.options.getFocused() || "mrbeast";
  const res = await fetch(
    `https://axern.space/api/search?platform=youtube&type=channel&query=${focusedValue}`,
  );
  const data: any = await res.json();
  await interaction.respond(
    data.map((channel: any) => ({
      name: `${channel.name} (${channel.username})`,
      value: channel.id,
    })),
  );
};
