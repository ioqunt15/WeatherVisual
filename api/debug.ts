import type { IncomingMessage, ServerResponse } from 'node:http'
import { Redis } from 'ioredis'
import { getTimeline } from '../server/kmaCache'

export default async function handler(req: IncomingMessage, res: ServerResponse & { status: (c: number) => any; json: (b: any) => void; end: () => void }) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  try {
    const url = process.env.REDIS_URL
    let clientInfo = 'none'

    if (url) {
      console.log('Testing named Redis constructor...')
      const client = new Redis(url, {
        maxRetriesPerRequest: 1,
        connectTimeout: 1000,
      })
      clientInfo = `initialized, status: ${client.status}`
      client.disconnect()
    }

    res.status(200).json({
      success: true,
      namedRedisType: typeof Redis,
      clientInfo,
      timeline: await getTimeline('temperature').then(t => ({ success: true, framesCount: t.frames.length })).catch(e => ({ success: false, error: e.message }))
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
