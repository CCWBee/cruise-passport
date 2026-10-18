// Takes the PNGs the render page draws in Brave and writes them to archive/emails/img/<name>.png.
// Local only, for the one cold-storage run. Run: node tools/coldstorage/receiver.mjs
import { createServer } from 'node:http'
import { mkdirSync, writeFileSync } from 'node:fs'
mkdirSync('archive/emails/img', { recursive: true })
createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Headers', '*'); res.end(); return }
  const name = new URL(req.url, 'http://x').searchParams.get('name') ?? ''
  if (req.method !== 'POST' || !/^[\w-]+$/.test(name)) { res.statusCode = 400; res.end(); return }
  const parts = []
  req.on('data', (c) => parts.push(c))
  req.on('end', () => { writeFileSync(`archive/emails/img/${name}.${(name.startsWith("slide-") || name.startsWith("poster-") || name === "hero") ? "jpg" : "png"}`, Buffer.concat(parts)); res.end('ok'); console.log('saved', name) })
}).listen(8792, '127.0.0.1', () => console.log('receiver on 8792'))
