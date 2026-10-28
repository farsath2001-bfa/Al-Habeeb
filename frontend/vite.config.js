import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development, "/api/..." calls are forwarded to the Express backend.
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
