import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Static demo page in public/reward-vs-task/index.html, reachable at /reward-vs-task
      { source: "/reward-vs-task", destination: "/reward-vs-task/index.html" },
    ];
  },
};

export default nextConfig;
