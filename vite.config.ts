import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const root = dirname(fileURLToPath(import.meta.url));

function ogHostPlugin(): Plugin {
  return {
    name: "starmind:og-host",
    transformIndexHtml(html) {
      const host = String(process.env.VITE_PUBLIC_HOSTNAME ?? "").trim();
      if (!host) return html;
      return html.replaceAll('content="/og.jpg"', `content="https://${host}/og.jpg"`);
    },
  };
}

async function grokPlugins(): Promise<Plugin[]> {
  if (!existsSync(join(root, "scripts/grok-pwa-plugin.mjs"))) return [];
  const mod = await import("./scripts/grok-pwa-plugin.mjs");
  return [mod.grokPwaPlugin() as Plugin];
}

export default defineConfig(async () => ({
  base: process.env.BASE_PATH || "/",
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 8080,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: Number(process.env.PORT) || 8080,
    strictPort: true,
  },
  build: {
    target: "esnext",
  },
  plugins: [ogHostPlugin(), ...(await grokPlugins())],
}));
