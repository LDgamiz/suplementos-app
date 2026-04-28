import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    exclude: ['node_modules', 'dist', 'e2e', '.git'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/hooks/**', 'src/lib/**', 'src/layout/**', 'src/pages/**'],
      exclude: ['**/*.test.*', 'src/test/**', '**/*.d.ts'],
    },
  },
})
