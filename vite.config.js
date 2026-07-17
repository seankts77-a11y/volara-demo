import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = dirname(fileURLToPath(import.meta.url));

// Base "./" makes the production build portable — the dist/ folder can be
// opened from any path or static host without rewriting asset URLs.
export default defineConfig({
  base: "./",
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: "es2019",
    outDir: "dist",
    assetsInlineLimit: 0,
    // Multi-page app: each HTML file is its own route/entry.
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        preorder: resolve(root, "preorder.html"),
      },
    },
  },
});
