import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],

  // ⚠️ Фікс для lightweight-charts
  optimizeDeps: {
    exclude: ["lightweight-charts"],
    // 🔧 підтягуємо поліфіли на етапі prebundle
    include: ["buffer", "process", "util"],
  },
  ssr: {
    noExternal: ["lightweight-charts"],
  },

  // 🔧 alias + define для сумісності деяких пакетів
  resolve: {
    alias: {
      buffer: "buffer",
      process: "process/browser",
      util: "util",
    },
  },
  define: {
    global: "globalThis",
    "process.env": {}, // щоб не падали звернення до process.env у браузері
  },

  server: {
    host: true,
    port: 5173,
    strictPort: false,
    proxy: {
      "/binance-api": {
        target: "https://api.binance.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/binance-api/, ""),
      },
      "/coingecko-api": {
        target: "https://api.coingecko.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/coingecko-api/, ""),
      },
      "/bybit": {
        target: "https://api.bybit.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/bybit/, ""),
      },
    },
  },

  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === "EVAL" && warning.id?.includes("lottie-web")) {
          return;
        }
        warn(warning);
      },
    },
  },

  preview: {
    port: 5174,
    strictPort: false,
  },
});
