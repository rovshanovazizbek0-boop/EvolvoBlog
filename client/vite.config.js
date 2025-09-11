import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    strictPort: true,
    hmr: {
      clientPort: 3000
    },
    watch: {
      usePolling: true,
      interval: 100
    }
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src')
      },
      {
        find: '@shared',
        replacement: path.resolve(__dirname, '../shared')
      },
      {
        find: '@assets',
        replacement: path.resolve(__dirname, '../attached_assets')
      }
    ]
  },
  build: {
    outDir: path.resolve(__dirname, '../dist/public'),
    emptyOutDir: true,
    rollupOptions: {
      external: []
    }
  }
});
