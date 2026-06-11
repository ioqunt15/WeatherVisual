import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createVhwisCacheMiddleware, scheduleVhwisCacheWarmup, closeRedisConnection } from './kmaCache.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 8080
const DIST_DIR = path.join(__dirname, '../dist')
const KMA_KEY = process.env.VITE_KMA_AUTH_KEY || ''

// Serve static file helper
function serveStaticFile(filePath: string, res: http.ServerResponse) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end('Not Found')
      return
    }

    // Basic Content-Type mapping
    const ext = path.extname(filePath).toLowerCase()
    let contentType = 'text/plain; charset=utf-8'
    if (ext === '.html') contentType = 'text/html; charset=utf-8'
    else if (ext === '.js') contentType = 'application/javascript; charset=utf-8'
    else if (ext === '.css') contentType = 'text/css; charset=utf-8'
    else if (ext === '.json') contentType = 'application/json; charset=utf-8'
    else if (ext === '.png') contentType = 'image/png'
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
    else if (ext === '.svg') contentType = 'image/svg+xml'
    else if (ext === '.ico') contentType = 'image/x-icon'

    res.setHeader('Content-Type', contentType)
    res.end(data)
  })
}

const cacheMiddleware = createVhwisCacheMiddleware(KMA_KEY)

const server = http.createServer((req, res) => {
  const url = req.url || '/'

  // API Route
  if (url.startsWith('/api/weather/')) {
    cacheMiddleware(req, res, () => {
      res.statusCode = 404
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.end('Not Found')
    })
    return
  }

  // Static files hosting
  let safeUrl = url.split('?')[0]
  if (safeUrl === '/') safeUrl = '/index.html'

  const targetPath = path.join(DIST_DIR, safeUrl)

  // Verify path is inside DIST_DIR to prevent directory traversal
  if (!targetPath.startsWith(DIST_DIR)) {
    res.statusCode = 403
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('Forbidden')
    return
  }

  fs.stat(targetPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA Fallback: serve index.html for client side routing
      serveStaticFile(path.join(DIST_DIR, 'index.html'), res)
    } else {
      serveStaticFile(targetPath, res)
    }
  })
})

// Warm up cache and start server
const stopWarmup = scheduleVhwisCacheWarmup(KMA_KEY)

server.listen(PORT, () => {
  console.log(`[VHWIS Production Server] Running at http://localhost:${PORT}`)
})

// Graceful shutdown helper
function handleShutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down server...`)
  stopWarmup()
  closeRedisConnection()
  server.close(() => {
    console.log('Server closed. Exiting process.')
    process.exit(0)
  })
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'))
process.on('SIGINT', () => handleShutdown('SIGINT'))
