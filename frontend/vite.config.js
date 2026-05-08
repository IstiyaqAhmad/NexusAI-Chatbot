import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/chat': 'http://localhost:8000',
      '/train': 'http://localhost:8000',
      '/stats': 'http://localhost:8000',
      '/categories': 'http://localhost:8000',
      '/history': 'http://localhost:8000',
      '/settings': 'http://localhost:8000',
      '/session': 'http://localhost:8000',
      '/search': 'http://localhost:8000',
      '/recommend': 'http://localhost:8000',
    }
  }
})

