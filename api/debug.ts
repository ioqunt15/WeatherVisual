import type { IncomingMessage, ServerResponse } from 'node:http'
import Redis from 'ioredis'

export default async function handler(req: IncomingMessage, res: ServerResponse & { status: (c: number) => any; json: (b: any) => void; end: () => void }) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  res.status(200).json({
    success: true,
    redisType: typeof Redis,
    redisExport: Redis ? Object.keys(Redis) : null
  })
}
