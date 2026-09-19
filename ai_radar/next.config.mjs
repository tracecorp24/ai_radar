import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {import('next').NextConfig} */
const sharedConfig = { serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"] };
const productionConfig = { ...sharedConfig, distDir: ".next-prod", output: "standalone" };

export default function nextConfig(phase) {
  return phase === PHASE_DEVELOPMENT_SERVER ? { ...sharedConfig, distDir: ".next" } : productionConfig;
}
