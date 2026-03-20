import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://waitros-backend.onrender.com',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://waitros-backend.onrender.com',
        changeOrigin: true,
      },
    },
  },
})

