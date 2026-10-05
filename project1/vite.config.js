import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  // relative paths so the build works from finkenkn.github.io/project1/dist/
  base: './',
})
