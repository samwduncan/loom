/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Bundle analysis: generates dist/bundle-report.html when ANALYZE=true
    ...(process.env.ANALYZE
      ? [
          visualizer({
            filename: 'dist/bundle-report.html',
            gzipSize: true,
            template: 'treemap',
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': '/src',
      '@loom/shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5184,
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/')) {
            // React core
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router-dom/')
            ) {
              return 'vendor-react';
            }
            // Markdown rendering
            if (
              id.includes('/react-markdown/') ||
              id.includes('/remark-gfm/') ||
              id.includes('/rehype-raw/')
            ) {
              return 'vendor-markdown';
            }
            // Syntax highlighting
            if (id.includes('/shiki/')) {
              return 'vendor-shiki';
            }
            // Radix UI primitives
            if (id.includes('/@radix-ui/') || id.includes('/radix-ui/')) {
              return 'vendor-radix';
            }
            // State management
            if (id.includes('/zustand/') || id.includes('/immer/')) {
              return 'vendor-zustand';
            }
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest-setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/vitest-setup.ts',
        'src/vite-env.d.ts',
        'src/main.tsx',
        'src/App.tsx',
      ],
      reporter: ['text', 'text-summary', 'lcov'],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
