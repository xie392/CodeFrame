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
  // server: {
  //   port: 5173,
  //   strictPort: true,
  //   hmr: {
  //     port: 5173,
  //   },
  // },
})
