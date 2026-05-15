import type { CatalogItem } from './types'

const API_BASE = 'https://api.scalev.com'

function buildForwardHeaders(request: Request) {
  const headers = new Headers(request.headers)
  headers.delete('origin')
  headers.delete('referer')
  headers.delete('cookie')
  return headers
}

export function buildTargetUrl(pathname: string, searchParams?: URLSearchParams) {
  const query = searchParams?.toString()
  return `${API_BASE}${pathname}${query ? `?${query}` : ''}`
}

export function proxyToScalev(request: Request, pathname: string, searchParams?: URLSearchParams) {
  return fetch(buildTargetUrl(pathname, searchParams), {
    method: request.method,
    headers: buildForwardHeaders(request),
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
  })
}

export async function fetchAllItems(request: Request, pathname: string, search?: string) {
  const items: CatalogItem[] = []
  let guestToken: string | null = null

  for (let page = 1; page <= 200; page += 1) {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('per_page', '100')
    if (search) {
      params.set('search', search)
    }

    const response = await proxyToScalev(request, pathname, params)
    guestToken ??= response.headers.get('x-scalev-guest-token')

    if (!response.ok) {
      return { error: response }
    }

    const payload = (await response.json()) as {
      data?: CatalogItem[]
      has_next?: boolean
    }
    const pageItems = Array.isArray(payload.data) ? payload.data : []
    items.push(...pageItems)

    if (pageItems.length === 0 || payload.has_next === false) {
      break
    }
  }

  return { items, guestToken }
}
