import { defineConfig } from 'vite';
import { copyFileSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  base: process.env.BASE_URL || '/',
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  plugins: [
    {
      name: 'copy-vehicles-csv',
      closeBundle() {
        // Copy vehicles.csv to dist directory after build
        copyFileSync(
          resolve(__dirname, 'vehicles.csv'),
          resolve(__dirname, 'dist/vehicles.csv')
        );
      }
    }
  ]
});