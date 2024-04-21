import { Server, Tv, Users } from "lucide-react";
import { unstable_noStore } from "next/cache";
import { webEnv as env } from "@statistical/env/web";
import { Stat } from "./stat";
import Link from "next/link";

interface Stats {
  servers: number;
  channelsTracked: number;
  totalSubscribers: number;
}

export async function Stats() {
  unstable_noStore();

  const res = await fetch(`${env.API_URL}/stats`);
  const stats: Stats = await res.json();

  return (
    <section className="flex flex-col items-center justify-center gap-6 pt-12">
      <h2 className="text-center text-4xl font-bold tracking-tight">
        Numbers speak louder than words
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-6">
        <Stat
          name="Servers"
          icon={
            <Server className="h-10 w-10 text-gray-500 dark:text-gray-400" />
          }
          count={stats.servers}
        />
        <Link href="/top">
          <Stat
            name="Channels tracked"
            icon={<Tv className="h-10 w-10 text-gray-500 dark:text-gray-400" />}
            count={stats.channelsTracked}
          />
        </Link>
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
        <Link href="/top">
          <Stat
            name="Channels tracked"
            icon={<Tv className="h-10 w-10 text-gray-500 dark:text-gray-400" />}
          />
        </Link>
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
