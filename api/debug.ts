import type { IncomingMessage, ServerResponse } from 'node:http'

export default async function handler(req: IncomingMessage, res: ServerResponse & { status: (c: number) => any; json: (b: any) => void; end: () => void }) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  res.status(200).json({
    success: true,
    message: "Debug route without imports is working!"
  })
}
