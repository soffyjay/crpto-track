import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// This plugin compiles Tailwind utility classes used in our React components.
export default defineConfig({
  plugins: [tailwindcss()],
  server: { proxy: { '/api': 'http://127.0.0.1:3001' } },
  preview: { proxy: { '/api': 'http://127.0.0.1:3001' } },
});
