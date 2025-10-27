import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env variables based on the current mode
  const env = loadEnv(mode, process.cwd(), '')
  
  console.log('=== VITE CONFIG DEBUG ===')
  console.log('Command:', command)
  console.log('Mode:', mode)
  console.log('Loaded env.VITE_API_URL:', env.VITE_API_URL)
  console.log('========================')
  
  return {
    plugins: [react()],
    server: {
      port: 3009,  // Updated to match the port you're using
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
      sourcemap: true,
      // Ensure _redirects file is copied to dist
      copyPublicDir: true
    },
    define: {
      // Properly define environment variables for the client
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL)
    }
  }
})