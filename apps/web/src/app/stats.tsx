import { LucideIcon, Server, Tv, Users } from "lucide-react";
import { unstable_noStore } from "next/cache";
import { webEnv as env } from "@statistical/env/web";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

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
      <h2 className="text-center text-4xl font-bold tracking-tight">
        Numbers speak louder than words
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-6">
        <Stat name="Servers" icon={Server} count={stats.servers} />
        <Link href="/top">
          <Stat
            name="Channels tracked"
            icon={Tv}
            count={stats.channelsTracked}
          />
        </Link>
        <Stat
          name="Total subscribers"
          icon={Users}
          count={stats.totalSubscribers}
        />
      </div>
    </section>
  );
}

function Stat({
  name,
  icon: Icon,
  count,
  width = 42,
}: {
  name: string;
  icon: LucideIcon;
  count?: number;
  width?: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border px-6 py-4">
      <Icon className="h-10 w-10 text-gray-500 dark:text-gray-400" />
      <div>
        {count && count !== 0 ? (
          <span className="text-2xl font-bold">{count.toLocaleString()}</span>
        ) : (
          <Skeleton className="h-8" style={{ width: `${width}px` }} />
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">{name}</p>
      </div>
    </div>
  );
}

export function StatsFallback() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 pt-12">
      <h2 className="text-4xl font-bold tracking-tight">
        Numbers speak louder than words
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-6">
        <Stat name="Servers" icon={Server} />
        <Link href="/top">
          <Stat name="Channels tracked" icon={Tv} />
        </Link>
        <Stat name="Total subscribers" icon={Users} width={187} />
      </div>
    </section>
  );
}
