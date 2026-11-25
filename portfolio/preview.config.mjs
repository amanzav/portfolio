import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('..', import.meta.url)),
  appType: 'mpa',
  build: { outDir: 'out' },
  preview: { host: '127.0.0.1', port: 3000, strictPort: true },
});
