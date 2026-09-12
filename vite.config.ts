/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    modulePreload: {
      // The flows chunk is only reached through Work.tsx's lazy() Scenes (its idle-time prefetch
      // calls import() directly, not modulepreload), so it must stay off the initial-JS path.
      resolveDependencies: (_filename, deps) => deps.filter((d) => !d.includes('/flows-')),
    },
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
      },
      output: {
        // Rolldown-native grouping (Vite 8): explicit groups so the entry's shared runtime never
        // gets folded into a lazy chunk. Without this, Rolldown put `react`/`scheduler` into
        // `flows`, which turned it into a static import of main. Order matters: first match wins.
        advancedChunks: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|use-sync-external-store)[\\/]/ },
            { name: 'motion', test: /(node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]|src[\\/](motion\.ts|MotionProvider\.tsx)$)/ },
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
