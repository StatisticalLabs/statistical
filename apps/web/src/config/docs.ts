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
  ],
};
