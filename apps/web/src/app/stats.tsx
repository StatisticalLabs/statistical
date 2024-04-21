import { Server, Tv, Users } from "lucide-react";
import { unstable_noStore } from "next/cache";
import { Skeleton } from "../components/ui/skeleton";
import { webEnv as env } from "@statistical/env/web";

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
        <div className="flex items-center gap-4 rounded-lg border px-6 py-4">
          <Server className="h-10 w-10 text-gray-500 dark:text-gray-400" />
          <div>
            <h3 className="text-2xl font-bold">
              {stats.servers.toLocaleString()}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Servers</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border px-6 py-4">
          <Tv className="h-10 w-10 text-gray-500 dark:text-gray-400" />
          <div>
            <h3 className="text-2xl font-bold">
              {stats.channelsTracked.toLocaleString()}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Channels tracked
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 border px-6 py-4">
          <Users className="h-10 w-10 text-gray-500 dark:text-gray-400" />
          <div>
            <h3 className="text-2xl font-bold">
              {stats.totalSubscribers.toLocaleString()}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Subscribers
            </p>
          </div>
        </div>
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
        <div className="flex items-center gap-4 rounded-lg border px-6 py-4">
          <Server className="h-10 w-10 text-gray-500 dark:text-gray-400" />
          <div className="flex-grow">
            <Skeleton className="h-8 w-full" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Servers</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border px-6 py-4">
          <Tv className="h-10 w-10 text-gray-500 dark:text-gray-400" />
          <div className="flex-grow">
            <Skeleton className="h-8 w-full" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Channels tracked
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 border px-6 py-4">
          <Users className="h-10 w-10 text-gray-500 dark:text-gray-400" />
          <div className="flex-grow">
            <Skeleton className="h-8 w-full" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Subscribers
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
