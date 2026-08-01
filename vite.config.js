import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The existing PWA assets live in src/public. Point Vite at that directory so
// manifest.webmanifest, service-worker.js, icons, offline.html and .htaccess
// are copied to the production build root.
export default defineConfig({
  plugins: [react()],
  base: '/',
  publicDir: 'src/public',
})
