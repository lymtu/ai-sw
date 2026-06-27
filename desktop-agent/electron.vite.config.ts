import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer'),
      },
    },
    optimizeDeps: {
      exclude: ['@huggingface/transformers'],
    },
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        input: {
          settings: resolve('src/renderer/settings.html'),
          overlay: resolve('src/renderer/overlay.html'),
        },
      },
    },
  },
})
