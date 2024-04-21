"use client";

import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table,
} from "@/components/ui/table";
import { Channel } from "./page";
import Image from "next/image";
import { abbreviate } from "@/lib/abbreviate";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createUrl } from "@/lib/search-params";

export function Channels({
  currentPage,
  totalPages,
  channels,
}: {
  currentPage: number;
  totalPages: number;
  channels: Channel[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  return (
    <>
      <div className="w-full rounded-lg border">
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-background">
                <TableHead className="w-[50px] text-center">Rank</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="w-[100px] text-center">
                  Subscribers
                </TableHead>
                <TableHead className="w-[100px] text-center">
                  Subscribers/day
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {channels.map((channel, index) => (
                <TableRow
                  key={channel.id}
                  className={index % 2 !== 0 ? "bg-muted/30" : ""}
                >
                  <TableCell className="text-center font-medium">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/analytics/${channel.id}`}>
                      <div className="flex items-center gap-3">
                        <Image
                          src={channel.avatar}
                          alt={`${channel.name} Avatar`}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                        <div>
                          <h2 className="font-semibold tracking-tight">
                            {channel.name}
                          </h2>
                          {channel.handle && (
                            <p className="text-xs text-muted-foreground">
                              {channel.handle}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {abbreviate(channel.lastUpdate?.subscribers || 0)}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {abbreviate(channel.lastUpdate?.subscriberRate || 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => {
              const newSearchParams = new URLSearchParams(
                searchParams.toString(),
              );
              newSearchParams.set("page", (currentPage - 1).toString());
              router.replace(createUrl(pathname, newSearchParams));
            }}
            disabled={currentPage === 1}
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Previous
          </Button>
          <Button
            onClick={() => {
              const newSearchParams = new URLSearchParams(
                searchParams.toString(),
              );
              newSearchParams.set("page", (currentPage + 1).toString());
              router.replace(createUrl(pathname, newSearchParams));
            }}
            disabled={currentPage === totalPages}
          >
            <ArrowRight className="mr-2 h-5 w-5" /> Next
          </Button>
        </div>
      )}
    </>
  );
}
