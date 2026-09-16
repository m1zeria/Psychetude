import { defineConfig } from 'vite';

export default defineConfig({
  base: './',              // relative paths to work on GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    open: true,
  },
});
