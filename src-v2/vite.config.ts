import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5555',
      '/ws': {
        target: 'ws://localhost:5555',
        ws: true,
      },
      '/shell': {
        target: 'ws://localhost:5555',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
