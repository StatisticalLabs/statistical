/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */

const createJiti = require("jiti");
const jiti = createJiti(__dirname);

jiti("@statistical/env/web");

const { createContentlayerPlugin } = require("next-contentlayer");

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
};

const withContentlayer = createContentlayerPlugin({
  // Additional Contentlayer config options
});

module.exports = withContentlayer(nextConfig);
