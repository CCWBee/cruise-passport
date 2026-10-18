// Loads summaries.ts through Vite, so the app's modules get import.meta.env and their own
// resolution, as they do in the browser. Run: node tools/coldstorage/run.mjs archive/<export>.json
import { createServer } from 'vite'
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try { await server.ssrLoadModule('/tools/coldstorage/summaries.ts') }
finally { await server.close() }
