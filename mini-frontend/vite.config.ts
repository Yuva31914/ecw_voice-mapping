import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Simple config; no proxy. We call http://localhost:5002 directly.
export default defineConfig({
  plugins: [react()],
  server: { port: 3000 }
})
