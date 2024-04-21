import { abbreviate } from "@/lib/abbreviate";
import { webEnv as env } from "@statistical/env/web";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Chart } from "./chart";

export default async function Analytics({
  params,
}: {
  params: Record<"channelId", string>;
}) {
  const res = await fetch(`${env.API_URL}/channels/${params.channelId}`);
  if (res.status === 404) return notFound();

  const data = await res.json();

  return (
    <section className="container py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <Image
            src={data.avatar}
            alt={`${data.name} Avatar`}
            width={90}
            height={90}
            className="rounded-full"
          />
          <div className="flex flex-col gap-1">
            <a
              href={`https://youtube.com/${data.handle ?? `channel/${data.id}`}`}
              target="_blank"
              className="flex items-end gap-1.5"
            >
              <h1 className="text-2xl font-bold tracking-tight">{data.name}</h1>
              {!!data.handle && (
                <p className="mb-0.5 text-sm text-muted-foreground">
                  {data.handle}
                </p>
              )}
            </a>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <span className="text-xl font-bold tracking-tight">
                  {abbreviate(data.subscribers)}
                </span>
                <p className="text-sm text-muted-foreground">subscribers</p>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold tracking-tight">
                  {data.views.toLocaleString()}
                </span>
                <p className="text-sm text-muted-foreground">total views</p>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold tracking-tight">
                  {data.videos.toLocaleString()}
                </span>
                <p className="text-sm text-muted-foreground">videos</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border p-4">
          <h1 className="text-center text-xl font-bold tracking-tight">
            Subscribers
          </h1>
          <Chart
            name={data.name}
            data={data.previousUpdates.map(
              (d: { timeHit: string; subscribers: number }) => [
                new Date(d.timeHit).getTime(),
                d.subscribers,
              ],
            )}
          />
        </div>
        <div className="flex flex-col gap-1 rounded-lg border p-4">
          <h1 className="text-center text-xl font-bold tracking-tight">
            Subscribers/day
          </h1>
          <Chart
            name={data.name}
            data={data.previousUpdates.map(
              (d: { timeHit: string; subscriberRate: number }) => [
                new Date(d.timeHit).getTime(),
                d.subscriberRate,
              ],
            )}
            gains
          />
        </div>
      </div>
    </section>
  );
}
