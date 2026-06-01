import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  // treat .glb 3D models as static assets (importable as URLs)
  assetsInclude: ["**/*.glb"],
  build: {
    // Don't inline assets as base64. The skin PNGs are tiny (<4KB) so Vite would
    // inline them as data URLs in prod — but skinview-utils' loadImage +
    // inferModelType pipeline misbehaves on data URLs, leaving characters
    // invisible in prod while working in dev. Force real file URLs everywhere.
    assetsInlineLimit: 0,
  },
});