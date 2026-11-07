import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const appMode = env.VITE_APP_MODE || 'community'
  if (!['community', 'pharmacy'].includes(appMode)) {
    throw new Error('VITE_APP_MODE must be community or pharmacy')
  }
  if (process.env.VERCEL && (!env.VITE_APP_MODE || !env.VITE_API_URL)) {
    throw new Error('Vercel builds require VITE_APP_MODE and VITE_API_URL')
  }
  if (env.VITE_API_URL) {
    const url = new URL(env.VITE_API_URL.trim())
    if (!['http:', 'https:'].includes(url.protocol) || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
      throw new Error('VITE_API_URL must be a backend origin without a path or credentials')
    }
  }
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        }
      }
    }
  }
})
