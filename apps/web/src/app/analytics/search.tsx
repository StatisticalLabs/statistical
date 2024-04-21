"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";

interface Result {
  avatar: string;
  id: string;
  username?: string;
  name: string;
}

export function Search() {
  const [results, setResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const res = await fetch(
      `https://axern.space/api/search?platform=youtube&type=channel&query=${inputRef.current!.value}`,
    );
    const data = await res.json();
    if (!res.ok) setError("An error occured.");
    if (!data.length) setError("No results found.");

    setResults(data);
    setIsLoading(false);
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <Input
          placeholder="Search for a channel..."
          ref={inputRef}
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
        </Button>
      </form>
      {error && <p className="pt-4 text-center text-red-500">{error}</p>}
      {!!results.length && (
        <div className="flex flex-col gap-3 pt-4">
          {results.map((result) => (
            <Link
              key={result.id}
              href={`/analytics/${result.id}`}
              className="flex items-center gap-2.5 rounded-lg border p-4 transition-all hover:bg-accent"
            >
              <Image
                src={result.avatar}
                alt={`${result.name} Avatar`}
                width={56}
                height={56}
                className="rounded-full"
              />
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  {result.name}
                </h2>
                {!!result.username && (
                  <p className="text-sm text-muted-foreground">
                    {result.username}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
