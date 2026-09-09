/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    modulePreload: {
      // The scene chunk is only ever reached through SceneMount's lazy() import (gated behind
      // useSceneGate), and the flows chunk only through Work.tsx's lazy() Scenes (its idle-time
      // prefetch calls import() directly, not modulepreload) — both must stay off the initial-JS
      // path, so don't let Vite modulepreload either from the entry HTML.
      resolveDependencies: (_filename, deps) => deps.filter((d) => !d.includes('/scene-') && !d.includes('/flows-')),
    },
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
      },
      output: {
        // Rolldown-native grouping (Vite 8): explicit groups so the entry's shared runtime never
        // gets folded into a lazy chunk. Without this, Rolldown put `react`/`scheduler` into
        // `scene` and `flows`, which turned both into static imports of main — evaluating all of
        // three.js at startup (P3-R15). Order matters: first match wins.
        advancedChunks: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|use-sync-external-store)[\\/]/ },
            { name: 'motion', test: /(node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]|src[\\/](motion\.ts|MotionProvider\.tsx)$)/ },
            // three-stdlib and three-mesh-bvh belong with three: GLTFLoader and friends live there
            // and load lazily with the scene (see tools/budget.mjs's lazy-chunk sum).
            { name: 'scene', test: /node_modules[\\/](three|three-stdlib|three-mesh-bvh|@react-three|its-fine|zustand|suspend-react|react-use-measure|@babel[\\/]runtime)[\\/]/ },
            // The four chapter Scenes are animation-heavy and only needed once their chapter
            // scrolls into view (P3-R14/F4; see Work.tsx's lazy() imports).
            { name: 'flows', test: /src[\\/]flows[\\/](ipcam|asd|pastis|med)[\\/]Scene\.tsx$/ },
          ],
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
