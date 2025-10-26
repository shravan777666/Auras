import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3008,
    proxy: {
      '/api': {
        target: 'http://localhost:5011',  // Updated to match actual backend port
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5011',  // Proxy uploads requests to backend
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  define: {
    'process.env': process.env
  }
})