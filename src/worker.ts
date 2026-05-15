interface Env {
  ASSETS: Fetcher
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/scalev-api/')) {
      const targetPath = url.pathname.replace('/scalev-api', '')
      const targetUrl = `https://api.scalev.com${targetPath}${url.search}`

      const headers = new Headers(request.headers)
      headers.delete('origin')
      headers.delete('referer')

      return fetch(targetUrl, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      })
    }

    return env.ASSETS.fetch(request)
  },
}
