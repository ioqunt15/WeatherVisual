import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createVhwisCacheMiddleware, scheduleVhwisCacheWarmup } from './server/kmaCache'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'vhwis-weather-cache',
        configureServer(server) {
          server.middlewares.use(createVhwisCacheMiddleware(env.VITE_KMA_AUTH_KEY))
          const stopWarmup = scheduleVhwisCacheWarmup(env.VITE_KMA_AUTH_KEY)
          server.httpServer?.once('close', stopWarmup)
        },
      },
    ],
    define: mode === 'production' ? {
      'console.log': '(() => {})',
      'console.info': '(() => {})',
      'console.debug': '(() => {})',
      'console.warn': '(() => {})',
    } : {},
  }
})
