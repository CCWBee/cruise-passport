interface Env {
  CRUISE_KV: KVNamespace
}

interface ShareEntry {
  t?: 1
  d?: string
  r?: number
  rc?: 1
  c?: string
}

interface SharePayload {
  v: 2
  id: string
  n: string
  c: string
  ts: number
  e: Record<string, ShareEntry>
  s: Record<string, 1>
}

interface StoredMember {
  payload: SharePayload
  updatedAt: number
}

const MAX_BODY_BYTES = 64 * 1024
const MAX_MEMBERS = 50
const PARAMETER_PATTERN = /^[A-Za-z0-9_-]{1,64}$/
const LOCALHOST_ORIGIN_PATTERN = /^http:\/\/localhost(:\d+)?$/

function corsHeaders(request: Request): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
  })
  const origin = request.headers.get('Origin')
  if (origin === 'https://ccwbee.github.io' || (origin !== null && LOCALHOST_ORIGIN_PATTERN.test(origin))) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Vary', 'Origin')
  }
  return headers
}

function json(request: Request, value: unknown, status = 200): Response {
  const headers = corsHeaders(request)
  headers.set('Content-Type', 'application/json; charset=utf-8')
  return new Response(JSON.stringify(value), { status, headers })
}

function error(request: Request, status: number, message: string): Response {
  return json(request, { error: message }, status)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isShareEntry(value: unknown): value is ShareEntry {
  if (!isObject(value)) return false
  if ('t' in value && value.t !== 1) return false
  if ('d' in value && typeof value.d !== 'string') return false
  if ('r' in value && typeof value.r !== 'number') return false
  if ('rc' in value && value.rc !== 1) return false
  if ('c' in value && typeof value.c !== 'string') return false
  return true
}

function isSharePayload(value: unknown): value is SharePayload {
  if (!isObject(value)) return false
  if (
    value.v !== 2 ||
    typeof value.id !== 'string' ||
    typeof value.n !== 'string' ||
    typeof value.c !== 'string' ||
    typeof value.ts !== 'number' ||
    !Number.isFinite(value.ts) ||
    !isObject(value.e) ||
    !isObject(value.s)
  ) return false

  if (!Object.values(value.e).every(isShareEntry)) return false
  return Object.values(value.s).every((visit) => visit === 1)
}

async function putMember(request: Request, env: Env, group: string, member: string): Promise<Response> {
  const contentLength = request.headers.get('Content-Length')
  if (contentLength !== null) {
    const declaredLength = Number(contentLength)
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return error(request, 413, 'Request body exceeds 64 KB.')
    }
  }

  const bytes = await request.arrayBuffer()
  if (bytes.byteLength > MAX_BODY_BYTES) return error(request, 413, 'Request body exceeds 64 KB.')

  let body: unknown
  try {
    body = JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return error(request, 400, 'Malformed JSON body.')
  }

  if (!isObject(body) || !isSharePayload(body.payload)) {
    return error(request, 400, 'Body must contain a valid SharePayload.')
  }
  if (body.payload.id !== member) return error(request, 403, 'Payload member does not match the URL.')

  const updatedAt = Date.now()
  await env.CRUISE_KV.put(
    `g:${group}:${member}`,
    JSON.stringify({ payload: body.payload, updatedAt } satisfies StoredMember),
  )
  return json(request, { ok: true, updatedAt })
}

async function getGroup(request: Request, env: Env, group: string): Promise<Response> {
  const prefix = `g:${group}:`
  const listed = await env.CRUISE_KV.list({ prefix, limit: MAX_MEMBERS })
  const members = await Promise.all(listed.keys.slice(0, MAX_MEMBERS).map(async ({ name }) => {
    const raw = await env.CRUISE_KV.get(name)
    if (raw === null) return null

    try {
      const stored: unknown = JSON.parse(raw)
      if (!isObject(stored) || !isSharePayload(stored.payload) ||
          typeof stored.updatedAt !== 'number' || !Number.isFinite(stored.updatedAt)) return null
      return { id: name.slice(prefix.length), payload: stored.payload, updatedAt: stored.updatedAt }
    } catch {
      return null
    }
  }))

  return json(request, { members: members.filter((member) => member !== null) })
}

async function fetch(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) })
  }

  try {
    const { pathname } = new URL(request.url)
    const putMatch = pathname.match(/^\/g\/([^/]+)\/([^/]+)$/)
    if (putMatch !== null) {
      if (!PARAMETER_PATTERN.test(putMatch[1]) || !PARAMETER_PATTERN.test(putMatch[2])) {
        return error(request, 400, 'Invalid group or member.')
      }
      if (request.method !== 'PUT') return error(request, 405, 'Method not allowed.')
      return await putMember(request, env, putMatch[1], putMatch[2])
    }

    const getMatch = pathname.match(/^\/g\/([^/]+)$/)
    if (getMatch !== null) {
      if (!PARAMETER_PATTERN.test(getMatch[1])) return error(request, 400, 'Invalid group.')
      if (request.method !== 'GET') return error(request, 405, 'Method not allowed.')
      return await getGroup(request, env, getMatch[1])
    }

    return error(request, 404, 'Not found.')
  } catch {
    return error(request, 500, 'Internal server error.')
  }
}

export default { fetch }
