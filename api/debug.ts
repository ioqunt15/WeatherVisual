import type { IncomingMessage, ServerResponse } from 'node:http'
import { getTimeline } from '../server/kmaCache'

export default async function handler(req: IncomingMessage, res: ServerResponse & { status: (c: number) => any; json: (b: any) => void; end: () => void }) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  try {
    const start = Date.now()
    const payload = await getTimeline('temperature', false)
    res.status(200).json({
      success: true,
      timeMs: Date.now() - start,
      payloadFrames: payload.frames.length,
      updatedAt: payload.updatedAt
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
