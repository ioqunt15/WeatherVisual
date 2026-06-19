import type { IncomingMessage, ServerResponse } from 'node:http'
import { getTimeline } from '../../server/kmaCache.ts'

type ExtendedRequest = IncomingMessage & {
  query: { [key: string]: string | string[] }
  method?: string
}

type ExtendedResponse = ServerResponse & {
  status: (code: number) => ExtendedResponse
  json: (body: any) => void
  end: () => void
}

export default async function handler(req: ExtendedRequest, res: ExtendedResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Extract scenario ID from request query (mapped from [scenario].ts)
  const scenarioId = req.query.scenario as string
  const forceRefresh = req.query.refresh === '1'
  const options = {
    start: (req.query.start as string) || undefined,
    end: (req.query.end as string) || undefined,
  }

  if (!scenarioId) {
    res.status(400).json({ error: 'Scenario ID is required' })
    return
  }

  try {
    const payload = await getTimeline(scenarioId as any, forceRefresh, options)
    res.status(200).json(payload)
  } catch (error) {
    console.error(`Error fetching timeline for ${scenarioId}:`, error)
    res.status(502).json({ error: error instanceof Error ? error.message : 'Weather API failed' })
  }
}
