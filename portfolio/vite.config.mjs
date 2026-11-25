import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: '/portfolio/',
  publicDir: false,
  build: {
    outDir: '../public/portfolio',
    emptyOutDir: true,
    target: 'es2020',
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    rolldownOptions: {
      input: fileURLToPath(new URL('./runtime/workspace-study.js', import.meta.url)),
      preserveEntrySignatures: 'strict',
      output: {
        entryFileNames: 'home.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        codeSplitting: { groups: [{ name: 'three', test: /node_modules/ }] },
        assetFileNames: asset => asset.names.some(name => name.endsWith('.css'))
          ? 'home.css' : 'assets/[name]-[hash][extname]',
      },
    },
    minify: true,
  },
});
