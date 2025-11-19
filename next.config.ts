import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	experimental: {
		webpackMemoryOptimizations: true,
	},
	reactStrictMode: true,
};

export default nextConfig;
