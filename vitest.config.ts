// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        // Configuration files that are showing up in coverage
        '.next/**',
        'next-env.d.ts',
        '**/postcss.config.mjs',
        '**/tailwind.config.ts',
        '**/tsconfig.json',
        '**/package.json',
        '**/package-lock.json',
        '**/next.config.ts',
        '**/vitest.config.ts',
      ],
      // Coverage thresholds (optional - you can adjust these)
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
      // Show coverage for all files, even if they have 0 coverage
      all: true,
      // Clean coverage reports before running
      clean: true,
      // Clean coverage reports on each run
      cleanOnRerun: true,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'), // <- update to match your "baseUrl"
    },
  },
})
