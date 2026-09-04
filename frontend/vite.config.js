import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

// This file is an ES module, so `__dirname` does not exist. Derive it so the
// "@" alias always points at <project>/src regardless of the directory the
// build is invoked from (Vercel does not always run from the project root).
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
  },
  server: {
    port: 5173,
    // Serve index.html for unknown paths so deep links work in `npm run dev`
    // the same way they do in production.
    historyApiFallback: true,
  },
  preview: {
    port: 4173,
  },
});
