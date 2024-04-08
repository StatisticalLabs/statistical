export const gain = (gain: number, round?: true) =>
  `${gain === 0 || gain > 0 ? "+" : ""}${(round ? Math.floor(gain) : gain).toLocaleString()}`;
