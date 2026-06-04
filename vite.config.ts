import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createKmaCacheMiddleware, scheduleKmaCacheWarmup } from './server/kmaCache'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'kma-weather-cache',
        configureServer(server) {
          server.middlewares.use(createKmaCacheMiddleware(env.VITE_KMA_AUTH_KEY))
          const stopWarmup = scheduleKmaCacheWarmup(env.VITE_KMA_AUTH_KEY)
          server.httpServer?.once('close', stopWarmup)
        },
      },
    ],
  }
})
