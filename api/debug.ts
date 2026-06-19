import type { IncomingMessage, ServerResponse } from 'node:http'

export default async function handler(req: IncomingMessage, res: ServerResponse & { status: (c: number) => any; json: (b: any) => void; end: () => void }) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  try {
    console.log('Starting debug dynamic import...')
    let kmaCache: any
    try {
      kmaCache = await import('../server/kmaCache.ts')
      console.log('Successfully imported kmaCache')
    } catch (importErr) {
      res.status(500).json({
        success: false,
        stage: 'import',
        error: importErr instanceof Error ? importErr.message : String(importErr),
        stack: importErr instanceof Error ? importErr.stack : undefined
      })
      return
    }

    console.log('Calling getTimeline...')
    try {
      const payload = await kmaCache.getTimeline('temperature', false)
      res.status(200).json({
        success: true,
        stage: 'execute',
        payloadFrames: payload.frames.length,
        updatedAt: payload.updatedAt
      })
    } catch (execErr) {
      res.status(500).json({
        success: false,
        stage: 'execute',
        error: execErr instanceof Error ? execErr.message : String(execErr),
        stack: execErr instanceof Error ? execErr.stack : undefined
      })
    }
  } catch (globalErr) {
    res.status(500).json({
      success: false,
      stage: 'global',
      error: globalErr instanceof Error ? globalErr.message : String(globalErr),
      stack: globalErr instanceof Error ? globalErr.stack : undefined
    })
  }
}
