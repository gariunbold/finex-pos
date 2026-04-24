import type { NextConfig } from "next"
import path from "path"

const isDev = process.env.NODE_ENV === "development"

const nextConfig: NextConfig = {
  ...(isDev ? {} : { output: "export" }),
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://finex.app.mn/api/:path*",
      },
    ]
  },
}

export default nextConfig
