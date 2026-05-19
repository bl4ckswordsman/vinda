import { sveltekit } from "@sveltejs/kit/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { defineConfig } from "vite";

function silenceThreePerf() {
  return {
    name: "silence-three-perf",
    enforce: "pre" as const,
    resolveId(id: string) {
      if (id === "three-perf") {
        return "\0mock-three-perf";
      }
    },
    load(id: string) {
      if (id === "\0mock-three-perf") {
        return "export class ThreePerf {}";
      }
    },
  };
}

export default defineConfig({
  plugins: [
    silenceThreePerf(),
    sveltekit(),
    SvelteKitPWA({
      strategies: "generateSW",
      registerType: "autoUpdate",
      manifest: {
        name: "Vinda — Fidget Music Box",
        short_name: "Vinda",
        description: "Spin a 3D music box to play melodies.",
        theme_color: "#0d0d0f",
        background_color: "#0d0d0f",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /\/models\/.+\.glb$/,
            handler: "CacheFirst",
            options: {
              cacheName: "models-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\/audio\/.+\.(mp3|ogg)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "audio-cache",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\/hdri\/.+\.hdr$/,
            handler: "CacheFirst",
            options: {
              cacheName: "hdri-cache",
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // Prevents 404s in dev mode
        type: "module",
      },
    }),
  ],

  optimizeDeps: {
    exclude: ["@threlte/core", "@threlte/extras"],
  },

  ssr: {
    noExternal: [
      "three",
      "@threlte/core",
      "@threlte/extras",
      "@use-gesture/vanilla",
    ],
  },
});
