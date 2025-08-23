import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    target: 'node18',
    lib: {
      entry: resolve(__dirname, 'src/cli.ts'),
      name: 'cli',
      fileName: 'cli',
      formats: ['es']
    },
    rollupOptions: {
      external: [
        'fs',
        'fs/promises',
        'path',
        'process',
        'os',
        'child_process',
        'react',
        'ink',
        'commander',
        'util',
        'node:child_process',
        'node:util',
        'node:path',
        'buffer',
        'string_decoder'
      ],
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
})
