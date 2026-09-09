/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    modulePreload: {
      // The scene and gltf chunks are only ever reached through SceneMount's lazy() import
      // (gated behind useSceneGate) and, deeper still, a chapter object's own lazy import; both
      // must stay off the initial-JS path, so don't let Vite modulepreload either from either
      // entry HTML.
      resolveDependencies: (_filename, deps) => deps.filter((d) => !d.includes('/scene-') && !d.includes('/gltf-')),
    },
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        style: resolve(import.meta.dirname, 'style/index.html'),
      },
      output: {
        manualChunks(id) {
          // GLTFLoader (in three-stdlib) alone needs ~20 KB gz of three.js classes to parse any
          // valid glTF — skinning, animation tracks, every texture filter — regardless of what a
          // given model uses. It's only reached once a chapter's object actually mounts (see
          // ChapterObjects' lazy import), so keep it out of the eagerly-loaded scene chunk.
          if (id.includes('node_modules/three-stdlib')) return 'gltf';
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
