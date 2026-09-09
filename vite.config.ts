/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    modulePreload: {
      // The scene chunk is only ever reached through SceneMount's lazy() import (gated behind
      // useSceneGate), so it must stay off the initial-JS path — don't let Vite modulepreload it
      // from either entry HTML.
      resolveDependencies: (_filename, deps) => deps.filter((d) => !d.includes('/scene-')),
    },
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
      },
      output: {
        manualChunks(id) {
          // node_modules/three also matches three-stdlib and three-mesh-bvh (substring check),
          // which is intentional: GLTFLoader and friends live there and belong with the rest of
          // three.js in the one lazily-loaded scene chunk (see tools/budget.mjs's lazy-chunk sum).
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
