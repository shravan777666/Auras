import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables based on the current mode
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
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
      // Properly define environment variables for the client
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL)
    }
  }
})