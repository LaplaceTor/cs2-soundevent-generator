import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Suitable for GitHub Pages
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('@codemirror') ||
              id.includes('w3c-keyname') ||
              id.includes('crelt') ||
              id.includes('style-mod')
            ) {
              return 'codemirror';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
