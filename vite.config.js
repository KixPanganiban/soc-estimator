import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    react(),
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