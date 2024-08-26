import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue(), viteSingleFile()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
