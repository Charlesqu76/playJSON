import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, "../dist"),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@charles/graph": path.resolve(__dirname, "../graph/src/"),
    },
  },
});
