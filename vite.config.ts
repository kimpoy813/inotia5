import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', allowedHosts: ['.e2b.app'] },
  preview: { host: '0.0.0.0', allowedHosts: ['.e2b.app'] },
  build: { chunkSizeWarningLimit: 1300, rollupOptions: { output: { manualChunks(id) { if (id.includes('/phaser/')) return 'world-engine' } } } },
  test: { include: ['tests/**/*.test.ts'] },
})
