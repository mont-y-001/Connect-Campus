import type { NextConfig } from "next";
import path from "path";

const appRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  outputFileTracingRoot: appRoot,
  turbopack: {
    root: appRoot,
  },
};

export default nextConfig;
