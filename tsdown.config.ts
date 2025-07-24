import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    './src/index.ts',
    './src/cli.ts',
  ],
  outDir: './dist',
  format: ['esm'],
  target: 'node18',
  sourcemap: false,
  declaration: true,
  clean: true,
  shebang: {
    cli: '#!/usr/bin/env node',
  },
  dts: {
    resolve: true,
  },
})
