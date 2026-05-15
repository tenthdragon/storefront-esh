import { errorJson, json } from '../_lib/http'
import { fetchAllItems, proxyToScalev } from '../_lib/scalev'
import { hasHiddenItems, isVisible, loadSettings } from '../_lib/settings'
import { isAuthenticated } from '../_lib/session'
import type { CatalogItem, StorefrontEnv } from '../_lib/types'

function copyResponse(response: Response) {
  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  })
}

function withGuestTokenHeaders(guestToken: string | null, payload: unknown) {
  const response = json(payload)
  if (guestToken) {
    response.headers.set('x-scalev-guest-token', guestToken)
  }
  return response
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function getCatalogPath(pathname: string) {
  const itemsMatch = pathname.match(/^\/v3\/stores\/[^/]+\/public\/items$/)
  const countMatch = pathname.match(/^\/v3\/stores\/[^/]+\/public\/items\/count$/)
  const productMatch = pathname.match(/^\/v3\/stores\/[^/]+\/public\/products\/[^/]+$/)
  const bundleMatch = pathname.match(/^\/v3\/stores\/[^/]+\/public\/bundle-price-options\/[^/]+$/)

  if (countMatch) return 'count'
  if (itemsMatch) return 'items'
  if (productMatch) return 'product'
  if (bundleMatch) return 'bundle'
  return null
}

export const onRequest: PagesFunction<StorefrontEnv> = async (context) => {
  const url = new URL(context.request.url)
  const targetPath = url.pathname.replace('/scalev-api', '')
  const targetQuery = new URLSearchParams(url.searchParams)
  const wantsAdminBypass = targetQuery.get('admin') === '1'
  targetQuery.delete('admin')

  if (wantsAdminBypass) {
    if (!(await isAuthenticated(context.request, context.env))) {
      return errorJson(401, 'Akses admin dibutuhkan untuk melihat katalog mentah.')
    }

    return copyResponse(await proxyToScalev(context.request, targetPath, targetQuery))
  }

  const catalogPath = context.request.method === 'GET' ? getCatalogPath(targetPath) : null
  if (!catalogPath) {
    return copyResponse(await proxyToScalev(context.request, targetPath, targetQuery))
  }

  const settings = await loadSettings(context.env)
  if (!hasHiddenItems(settings)) {
    return copyResponse(await proxyToScalev(context.request, targetPath, targetQuery))
  }

  if (catalogPath === 'items' || catalogPath === 'count') {
    const search = targetQuery.get('search')?.trim() || undefined
    const page = parsePositiveInt(targetQuery.get('page'), 1)
    const perPage = parsePositiveInt(targetQuery.get('per_page'), 20)
    const result = await fetchAllItems(context.request, targetPath.replace(/\/count$/, ''), search)
    if ('error' in result) {
      return copyResponse(result.error)
    }

    const visibleItems = result.items.filter((item) => isVisible(settings, item.entity_type, item.id))
    if (catalogPath === 'count') {
      return withGuestTokenHeaders(result.guestToken, { total: visibleItems.length })
    }

    const start = (page - 1) * perPage
    const data = visibleItems.slice(start, start + perPage)
    return withGuestTokenHeaders(result.guestToken, { data })
  }

  const response = await proxyToScalev(context.request, targetPath, targetQuery)
  if (!response.ok) {
    return copyResponse(response)
  }

  const payload = await response.json() as CatalogItem
  const entityType = catalogPath === 'product' ? 'product' : 'bundle_price_option'
  if (!isVisible(settings, entityType, payload.id)) {
    return errorJson(404, 'Item ini sedang disembunyikan dari storefront.')
  }

  const proxiedResponse = json(payload, {
    status: response.status,
    headers: response.headers,
  })
  return proxiedResponse
}
