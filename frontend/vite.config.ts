import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // This tells React: "If I ask for /api, fetch it from my backend!"
      '/api': 'http://localhost:3000' 
    }
  }
})