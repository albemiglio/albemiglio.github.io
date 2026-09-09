/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    modulePreload: {
      // The scene chunk is only ever reached through SceneMount's lazy() import, gated behind
      // useSceneGate; it must stay off the initial-JS path, so don't let Vite modulepreload it
      // from either entry HTML.
      resolveDependencies: (_filename, deps) => deps.filter((d) => !d.includes('/scene-')),
    },
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        style: resolve(import.meta.dirname, 'style/index.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) return 'scene';
          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
  },
});
