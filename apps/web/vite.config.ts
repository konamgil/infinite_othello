/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: ['.ngrok-free.app', 'localhost', '127.0.0.1']
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
});

