import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/cli.ts'),
      name: 'cli',
      fileName: 'cli',
      formats: ['es']
    },
    rollupOptions: {
      external: ['fs', 'path', 'process', 'os', 'react', 'ink', 'commander'],
      output: {
        banner: '#!/usr/bin/env node'
      }
    },
    outDir: 'dist',
    minify: false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  esbuild: {
    jsx: 'automatic'
  }
});