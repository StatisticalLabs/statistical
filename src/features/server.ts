import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { BotClient } from "@/structures/client";
import {
  getYouTubeChannel,
  trackers,
  youtubeChannels,
  type YouTubeChannel,
} from "@/utils/db";
import { env } from "@/utils/env";

const formatChannel = (channel: YouTubeChannel) => ({
  id: channel.id,
  name: channel.name,
  handle: channel.handle,
  lastUpdate: channel.currentUpdate
    ? {
        timeHit: channel.currentUpdate.timeHit,
        subscribers: channel.currentUpdate.subscribers,
        subscriberRate: channel.currentUpdate.subscriberRate * (60 * 60 * 24),
      }
    : undefined,
});

export default (client: BotClient<true>) => {
  const app = new Hono();

  app.get("/", (c) =>
    c.json({
      hello: "world!",
    }),
  );

  const pageSize = 10;
  app.get(
    "/channels",
    zValidator(
      "query",
      z.object({
        page: z.number().optional(),
        sort: z.enum(["name", "subscribers"]).optional(),
      }),
    ),
    (c) => {
      const { page = 1, sort = "subscribers" } = c.req.valid("query");
      const startIndex = (page - 1) * pageSize;
      const endIndex = page * pageSize;
      const sortedChannels = [...youtubeChannels]
        .sort((a, b) =>
          sort === "name"
            ? a.name.localeCompare(b.name)
            : (b.currentUpdate?.subscribers ?? 0) -
              (a.currentUpdate?.subscribers ?? 0),
        )
        .map(formatChannel);
      const paginatedChannels = sortedChannels.slice(startIndex, endIndex);
      const totalPages = Math.ceil(sortedChannels.length / pageSize);

      return c.json({
        totalPages,
        channelsPerPage: pageSize,
        channels: paginatedChannels,
      });
    },
  );

  app.get("/channels/:id", async (c) => {
    const id = c.req.param("id");
    const dbChannel = getYouTubeChannel(id);
    if (!dbChannel) return c.json({ error: "Channel not found" }, 404);

    let previousUpdates: {
      timeHit: Date;
      subscribers: number;
      subscriberRate: number;
    }[] = [];
    const previousUpdatesFile = Bun.file(`./data/history/${id}.csv`);
    if (previousUpdatesFile.size === 0) previousUpdates = [];
    else {
      const lines = (await previousUpdatesFile.text()).split("\n");
      lines.splice(0, 1);
      previousUpdates = lines
        .map((line) => {
          const [date, subscribers, average] = line.split(",");
          return {
            timeHit: new Date(date),
            subscribers: parseFloat(subscribers),
            subscriberRate: parseFloat(average),
          };
        })
        .filter(
          ({ timeHit: date, subscribers, subscriberRate: average }) =>
            !isNaN(date.getTime()) && !isNaN(subscribers) && !isNaN(average),
        );
    }

    return c.json({ ...formatChannel(dbChannel), previousUpdates });
  });

  app.get("/stats", (c) => {
    const totalSubscribers = youtubeChannels
      .map((c) => c.currentUpdate?.subscribers ?? 0)
      .reduce((a, b) => a + b, 0);
    return c.json({
      servers: client.guilds.cache.size,
      channelsTracked: trackers.length,
      totalSubscribers,
    });
  });

  Bun.serve({
    fetch: app.fetch,
    port: env.API_PORT,
  });
  console.log(`Listening on port ${env.API_PORT}.`);
};
