import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "node:path";

// Build em modo "library": gera o pacote @blustar/ui para publicar no npm.
export default defineConfig({
  plugins: [
    react(),
    dts({ include: ["src"], exclude: ["src/**/*.stories.tsx"] }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "BlustarUI",
      fileName: "index",
      formats: ["es"],
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        assetFileNames: "blustar-ui.[ext]",
        globals: { react: "React", "react-dom": "ReactDOM" },
      },
    },
  },
});
