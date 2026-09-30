import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Static HTML export (→ out/) so the site can be served by GitHub Pages
  output: 'export',
  // Don't auto-generate AGENTS.md / CLAUDE.md in the project root during `next dev`
  agentRules: false,
};

export default nextConfig;
