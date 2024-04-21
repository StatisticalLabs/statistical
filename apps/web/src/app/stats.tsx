import { Server, Tv, Users } from "lucide-react";
import { unstable_noStore } from "next/cache";
import { Skeleton } from "../components/ui/skeleton";
import { webEnv as env } from "@statistical/env/web";
import { Stat } from "./stat";

interface Stats {
  servers: number;
  channelsTracked: number;
  totalSubscribers: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function Stats() {
  unstable_noStore();

  await sleep(3000);

  const res = await fetch(`${env.API_URL}/stats`);
  const stats: Stats = await res.json();

  return (
    <section className="flex flex-col items-center justify-center gap-6 pt-12">
      <h2 className="text-4xl font-bold tracking-tight">
        Numbers speak louder than words
      </h2>
      <div className="grid grid-cols-1 gap-6 px-4 md:grid-cols-2 lg:grid-cols-3">
        <Stat
          name="Servers"
          icon={
            <Server className="h-10 w-10 text-gray-500 dark:text-gray-400" />
          }
          count={stats.servers}
        />
        <Stat
          name="Channels tracked"
          icon={<Tv className="h-10 w-10 text-gray-500 dark:text-gray-400" />}
          count={stats.channelsTracked}
        />
        <Stat
          name="Total subscribers"
          icon={
            <Users className="h-10 w-10 text-gray-500 dark:text-gray-400" />
          }
          count={stats.totalSubscribers}
        />
      </div>
    </section>
  );
}

export function StatsFallback() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 pt-12">
      <h2 className="text-4xl font-bold tracking-tight">
        Numbers speak louder than words
      </h2>
      <div className="grid grid-cols-1 gap-6 px-4 md:grid-cols-2 lg:grid-cols-3">
        <Stat
          name="Servers"
          icon={
            <Server className="h-10 w-10 text-gray-500 dark:text-gray-400" />
          }
        />
        <Stat
          name="Channels tracked"
          icon={<Tv className="h-10 w-10 text-gray-500 dark:text-gray-400" />}
        />
        <Stat
          name="Total subscribers"
          icon={
            <Users className="h-10 w-10 text-gray-500 dark:text-gray-400" />
          }
        />
      </div>
    </section>
  );
}
