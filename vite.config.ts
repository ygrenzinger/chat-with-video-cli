import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    target: 'node22',
    lib: {
      entry: resolve(__dirname, 'src/chat-with-video.ts'),
      name: 'chat-with-video',
      fileName: 'chat-with-video',
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
        'node:module',
        'ink-spinner',
        'ink-text-input',
        'copy-paste',
        'ai',
        'zod',
        '@ai-sdk/anthropic',
        '@ai-sdk/google',
        '@ai-sdk/mistral',
        '@ai-sdk/openai',
        '@ai-sdk/provider',
        'node:crypto',
        'node:fs',
        'copy-paste/promises.js',
        'markdansi',
        'buffer',
        'string_decoder',
        'xstate',
        '@xstate/react'
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
