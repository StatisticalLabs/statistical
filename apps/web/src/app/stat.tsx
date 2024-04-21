"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ReactNode } from "react";
import CountUp from "react-countup";

export function Stat({
  name,
  icon: Icon,
  count,
}: {
  name: string;
  icon: ReactNode;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border px-6 py-4">
      {Icon}
      <div className="flex-grow">
        {count || count === 0 ? (
          <CountUp end={count} delay={0}>
            {({ countUpRef }) => (
              <span className="text-2xl font-bold" ref={countUpRef} />
            )}
          </CountUp>
        ) : (
          <Skeleton className="h-8 w-full" />
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">{name}</p>
      </div>
    </div>
  );
}
