/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import { resolve } from 'path'
import manifest from './manifest.json'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        editor: resolve(__dirname, 'src/editor/index.html'),
        codegen: resolve(__dirname, 'src/codegen/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
      },
    },
    sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : false,
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
  // Vitest 配置
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/editor/**/*.ts',
        'src/editor/**/*.tsx',
        'src/background/**/*.ts',
        'src/content/**/*.ts',
        'src/codegen/**/*.ts',
        'src/shared/stores/**/*.ts',
        'src/shared/components/ui/**/*.tsx',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        'src/**/index.ts',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
})
