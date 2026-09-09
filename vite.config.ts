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
        manualChunks(id) {
          // The four chapter Scene modules are animation-heavy (motion/react + per-flow CSS) but
          // only ever needed once their chapter scrolls into view, so they get their own lazy
          // chunk instead of riding in initial JS (P3-R14/F4; see Work.tsx's lazy() imports and
          // tools/budget.mjs's separate flows-chunk limit).
          if (id.includes('/src/flows/') && /\/(ipcam|asd|pastis|med)\/Scene\.tsx$/.test(id)) return 'flows';
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
