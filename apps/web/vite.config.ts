/// <reference types="vitest" />
import { defineConfig } from "vite";
import path from 'node:path';
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@store': path.resolve(__dirname, 'src/store'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@services': path.resolve(__dirname, 'src/services')
    }
  },
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

