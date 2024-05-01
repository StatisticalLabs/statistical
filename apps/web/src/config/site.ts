import type { ItemWithHref } from "@/lib/types/item";

interface SiteConfig {
  links: {
    invite: string;
    github: string;
  };
  license: {
    name: string;
    href: string;
  };
  copyright: string;
  navbarItems: ItemWithHref[];
}

export const siteConfig: SiteConfig = {
  links: {
    invite: "/invite",
    github: "https://github.com/StatisticalLabs/statistical",
  },
  license: {
    name: "MIT",
    href: "https://github.com/StatisticalLabs/statistical/blob/main/LICENSE",
  },
  copyright: "Statistical Labs, a subsidiary of Graphify Studios",
  navbarItems: [
    {
      title: "Docs",
      href: "/docs",
    },
    {
      title: "Analytics",
      href: "/analytics",
    },
    {
      title: "Top",
      href: "/top",
    },
  ],
};
