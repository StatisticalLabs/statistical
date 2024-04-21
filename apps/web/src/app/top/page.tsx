import { webEnv as env } from "@statistical/env/web";
import { Channels } from "./channels";
import { Metadata } from "next";

interface TopAPIResponse {
  totalPages: number;
  channelsPerPage: 50;
  channels: Channel[];
}

export interface Channel {
  rank: number;
  id: string;
  name: string;
  handle?: string;
  avatar: string;
  lastUpdate?: {
    timeHit: string;
    subscribers: number;
    subscriberRate: number;
  };
}

export const metadata: Metadata = {
  title: "Top Channels",
  description: "View the top channels through Statistical.",
};

export const revalidate = 3600;

export default async function Top({
  searchParams,
}: {
  searchParams: Record<"page", string | string[] | undefined>;
}) {
  const page = parseInt(
    (typeof searchParams.page === "object"
      ? searchParams.page[0]
      : searchParams.page) ?? "1",
  );

  const res = await fetch(`${env.API_URL}/channels?page=${page}`);
  const data: TopAPIResponse = await res.json();

  return (
    <section className="container py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight">Top Channels</h1>
        </div>
        <Channels
          currentPage={page}
          totalPages={data.totalPages}
          channels={data.channels}
        />
      </div>
    </section>
  );
}
