import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.BASE_URL || '/',
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});