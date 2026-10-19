import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' keeps the build portable: it works on GitHub Pages under any repo name
// because routing is hash-based (#/ and #/components).
export default defineConfig({
  base: './',
  plugins: [react()],
})
