export function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  headers.delete('content-length')
  if (!headers.has('content-type')) {
    headers.set('content-type', 'application/json; charset=utf-8')
  }

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  })
}

export function errorJson(status: number, message: string) {
  return json({ message }, { status })
}
