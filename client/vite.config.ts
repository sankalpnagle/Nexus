import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "https://nexus-62ih.onrender.com", changeOrigin: true },
      "/socket.io": {
        target: "https://nexus-62ih.onrender.com",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
