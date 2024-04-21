import type { Item } from "@/lib/types/item";

interface DocsConfig {
  sidebarItems: Item[];
}

export const docsConfig: DocsConfig = {
  sidebarItems: [
    {
      title: "Getting Started",
      items: [
        {
          title: "Introduction",
          href: "/docs",
        },
      ],
    },
    {
      title: "Tracking",
      items: [
        {
          title: "Start tracking",
          href: "/docs/start-tracking",
        },
        {
          title: "Stop tracking",
          href: "/docs/stop-tracking",
        },
      ],
    },
  ],
};
