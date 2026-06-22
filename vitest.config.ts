import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./inertia/tests/setup.ts'],
    // Only run frontend tests; backend uses Japa (tests/**/*.spec.ts).
    include: ['inertia/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '~/': `${import.meta.dirname}/inertia/`,
    },
  },
})
