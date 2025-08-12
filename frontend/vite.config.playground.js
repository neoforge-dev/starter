/**
 * Vite configuration specifically for the Native Web Components Playground
 */
import { defineConfig } from 'vite';

export default defineConfig({
  root: './src/playground',
  publicDir: '../public',
  build: {
    outDir: '../../dist/playground',
    emptyOutDir: true,
    rollupOptions: {
      input: './src/playground/advanced-playground.html'
    }
  },
  server: {
    port: 3001,
    open: '/advanced-playground.html'
  },
  resolve: {
    alias: {
      '@': '/src',
      '/components': '/src/components'
    }
  }
});