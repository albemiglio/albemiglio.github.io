import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

export default defineConfig({
  testDir: '.',
  outputDir: './test-results',
  timeout: 120_000,
  use: { baseURL: 'http://127.0.0.1:4173', colorScheme: 'dark' },
  webServer: {
    command: 'npx vite preview --host 127.0.0.1 --port 4173 --strictPort',
    cwd: resolve(import.meta.dirname, '..'),
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
        },
      },
    },
    // Safari's engine: every spec runs here too, so a WebKit-only regression (scroll handoff,
    // sticky stage, motion animations) fails the deploy instead of surfacing on a Mac.
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
