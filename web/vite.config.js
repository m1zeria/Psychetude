import { defineConfig } from 'vite';

export default defineConfig({
  base: './',              // relative paths → works on GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    open: true,
  },
});
