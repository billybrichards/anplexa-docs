import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3002,
    host: '0.0.0.0',
  },
  preview: {
    port: 3002,
    host: '0.0.0.0',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './client/src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
