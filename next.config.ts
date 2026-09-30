import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Don't auto-generate AGENTS.md / CLAUDE.md in the project root during `next dev`
  agentRules: false,
};

export default nextConfig;
