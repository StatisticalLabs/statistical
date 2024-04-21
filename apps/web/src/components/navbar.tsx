"use client";

import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./themes";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 py-2 backdrop-blur-sm">
      <div className="container flex items-center justify-between">
        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 transition-all hover:opacity-80"
          >
            <Image
              src="/statistical.png"
              alt="Statistical Logo"
              width={40}
              height={40}
            />
          </Link>
          <div className="hidden md:flex md:items-center md:gap-4">
            {siteConfig.navbarItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "text-[14.5px] transition-colors hover:text-foreground/80 hover:underline",
                  pathname.startsWith(item.href)
                    ? "font-medium"
                    : "text-foreground/60",
                )}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
