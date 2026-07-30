const BASE = '/api/es'

const ALLOWED_POST = new Set(['/_cluster/allocation/explain'])

const BLOCKED_METHODS = new Set(['PUT', 'DELETE', 'PATCH'])

function normalizePath(path: string): string {
  if (!path.startsWith('/')) return `/${path}`
  return path
}

function assertAllowed(method: string, path: string): void {
  const upper = method.toUpperCase()
  if (BLOCKED_METHODS.has(upper)) {
    throw new Error(`esvue: blocked write method ${upper} ${path}`)
  }
  if (upper === 'POST') {
    const bare = path.split('?')[0]!
    if (!ALLOWED_POST.has(bare)) {
      throw new Error(`esvue: blocked POST ${path}`)
    }
    return
  }
  if (upper !== 'GET' && upper !== 'HEAD') {
    throw new Error(`esvue: blocked method ${upper} ${path}`)
  }
  if (/\b_bulk\b/.test(path) || /\/_search(\?|$)/.test(path)) {
    throw new Error(`esvue: blocked path ${path}`)
  }
}

export class EsClientError extends Error {
  status: number
  body: string

  constructor(message: string, status: number, body: string) {
    super(message)
    this.name = 'EsClientError'
    this.status = status
    this.body = body
  }
}

export async function esFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method ?? 'GET').toUpperCase()
  const normalized = normalizePath(path)
  assertAllowed(method, normalized)

  const url = `${BASE}${normalized}`
  const res = await fetch(url, {
    ...init,
    method,
    headers: {
      Accept: 'application/json, text/plain, */*',
      ...(init.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new EsClientError(
      `ES ${method} ${normalized} failed: ${res.status}`,
      res.status,
      body,
    )
  }
  return res
}

export async function esGetText(path: string): Promise<string> {
  const res = await esFetch(path)
  return res.text()
}

export async function esGetJson<T>(path: string): Promise<T> {
  const res = await esFetch(path)
  return res.json() as Promise<T>
}

export async function esPostJson<T>(path: string, body: unknown): Promise<T> {
  const res = await esFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json() as Promise<T>
}
