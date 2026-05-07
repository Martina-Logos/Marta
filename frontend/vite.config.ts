import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  worker: {
    format: 'es',              // Required for Transformers.js workers
  },

  optimizeDeps: {
    exclude: [
      '@xenova/transformers',  // Must NOT be pre-bundled — loads WASM dynamically
      '@ffmpeg/ffmpeg',
      '@ffmpeg/util',
    ],
  },

  server: {
    headers: {
      // Required for SharedArrayBuffer (FFmpeg multi-threading)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})