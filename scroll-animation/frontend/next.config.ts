import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    PYTHON_BACKEND_URL: process.env.PYTHON_BACKEND_URL || "https://check-to-work-bbzs.onrender.com",
  },
};

export default nextConfig;
