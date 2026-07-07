import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // In dev, proxy API calls to the intranet backend (npm run server).
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: false },
    },
  },
})
