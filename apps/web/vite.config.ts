import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@impostor/domain": fileURLToPath(
        new URL("../../packages/domain/src/index.ts", import.meta.url)
      )
    }
  },
  server: {
    host: "127.0.0.1",
    port: 3400,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3401",
        ws: true
      }
    }
  },
  preview: {
    host: "127.0.0.1",
    port: 3400,
    strictPort: true
  }
});
