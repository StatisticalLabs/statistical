/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */

const createJiti = require("jiti");
const jiti = createJiti(__dirname);

jiti("@statistical/env/web");

const { createContentlayerPlugin } = require("next-contentlayer");

/** @type {import('next').NextConfig} */
const nextConfig = {
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
