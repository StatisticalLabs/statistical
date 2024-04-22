/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */

const createJiti = require("jiti");
const jiti = createJiti(__dirname);

jiti("@statistical/env/web");

const { createContentlayerPlugin } = require("next-contentlayer");
const createMDX = require("@next/mdx");

/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: async () => [
    {
      source: "/invite",
      destination:
        "https://discord.com/oauth2/authorize?client_id=1226539048118649022",
      permanent: false,
    },
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yt3.ggpht.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ["@statistical/env"],
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

module.exports = async () => {
  const rehypeSlug = (await import("rehype-slug")).default;
  const rehypeAutolinkHeadings = (await import("rehype-autolink-headings"))
    .default;

  const withContentlayer = createContentlayerPlugin({});
  const withMDX = createMDX({
    options: {
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: "wrap",
            properties: {
              ariaHidden: true,
              tabIndex: -1,
              class: "heading-link",
            },
          },
        ],
      ],
    },
  });

  const withPlugins = (nextConfig) => withMDX(withContentlayer(nextConfig));
  return withPlugins(nextConfig);
};
