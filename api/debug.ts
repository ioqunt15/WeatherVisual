import type { IncomingMessage, ServerResponse } from 'node:http'
import { scenarios } from '../src/data/scenarios'

export default async function handler(req: IncomingMessage, res: ServerResponse & { status: (c: number) => any; json: (b: any) => void; end: () => void }) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  const redisUrl = process.env.REDIS_URL
  const maskedRedisUrl = redisUrl
    ? `${redisUrl.slice(0, 15)}... (len: ${redisUrl.length})`
    : 'undefined'

  res.status(200).json({
    success: true,
    redisUrlStatus: maskedRedisUrl,
    scenariosCount: scenarios.length,
    firstScenarioId: scenarios[0]?.id
  })
}
