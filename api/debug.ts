import type { IncomingMessage, ServerResponse } from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

function listFiles(dir: string, fileList: string[] = []): string[] {
  try {
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const name = path.join(dir, file)
      if (fs.statSync(name).isDirectory()) {
        if (!file.includes('node_modules') && !file.startsWith('.')) {
          listFiles(name, fileList)
        }
      } else {
        fileList.push(name)
      }
    }
  } catch (err) {
    fileList.push(`Error reading ${dir}: ${err instanceof Error ? err.message : String(err)}`)
  }
  return fileList
}

export default async function handler(req: IncomingMessage, res: ServerResponse & { status: (c: number) => any; json: (b: any) => void; end: () => void }) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  const taskDir = '/var/task'
  const files = listFiles(taskDir)

  res.status(200).json({
    success: true,
    cwd: process.cwd(),
    files: files.map(f => f.replace(taskDir, ''))
  })
}
