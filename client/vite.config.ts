import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://13.233.84.226:5000", changeOrigin: true },
      "/socket.io": {
        target: "http://13.233.84.226:5000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
