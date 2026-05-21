import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Transpile the workspace package (TS source) and silence the multi-lockfile
  // warning by pinning the root to the actual workspace root.
  transpilePackages: ["@ailt/shared"],
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
};

export default nextConfig;
