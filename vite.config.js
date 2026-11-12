import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// This plugin compiles Tailwind utility classes used in our React components.
export default defineConfig({
  plugins: [tailwindcss()],
});
