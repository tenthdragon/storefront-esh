import { storefrontFetch, parseResponse } from './client'
import { getPublicStorefrontSettings } from './storefront-settings'
import type { Item, Product, Bundle, ProductVariant } from '@/types'
import { isItemVisible } from '@/utils/visibility'

async function getVisibleItems(search?: string) {
  const settings = await getPublicStorefrontSettings()
  const items: Item[] = []

  for (let page = 1; page <= 200; page += 1) {
    const query = new URLSearchParams()
    query.set('page', String(page))
    query.set('per_page', '100')
    if (search) query.set('search', search)

    const res = await storefrontFetch(`/public/items?${query}`)
    const payload = await parseResponse<{ data: Item[] }>(res)
    const pageItems = Array.isArray(payload.data) ? payload.data : []
    items.push(...pageItems.filter((item) => isItemVisible(settings, item.entity_type, item.id)))

    if (pageItems.length < 100) {
      break
    }
  }

  return items
}

export async function getItemCount(search?: string) {
  const items = await getVisibleItems(search)
  return { total: items.length }
}

export async function getItems(params: {
  page?: number
  per_page?: number
  search?: string
} = {}) {
  const visibleItems = await getVisibleItems(params.search)
  const page = params.page ?? 1
  const perPage = params.per_page ?? 20
  const start = (page - 1) * perPage
  return { data: visibleItems.slice(start, start + perPage) }
}

export async function getProduct(slug: string) {
  const res = await storefrontFetch(`/public/products/${slug}`)
  const product = await parseResponse<Product>(res)
  const settings = await getPublicStorefrontSettings()
  if (!isItemVisible(settings, 'product', product.id)) {
    throw new Error('Item ini sedang disembunyikan dari storefront.')
  }
  return product
}

export async function getBundle(slug: string) {
  const res = await storefrontFetch(`/public/bundle-price-options/${slug}`)
  const bundle = await parseResponse<Bundle>(res)
  const settings = await getPublicStorefrontSettings()
  if (!isItemVisible(settings, 'bundle_price_option', bundle.id)) {
    throw new Error('Item ini sedang disembunyikan dari storefront.')
  }
  return bundle
}

export async function getVariantPricing(ids: number[]) {
  const res = await storefrontFetch(`/public/variants/pricing?ids=${ids.join(',')}`)
  return parseResponse<ProductVariant[]>(res)
}

export async function getVariantAvailability(variantId: number) {
  const res = await storefrontFetch(`/public/variants/${variantId}/availability`)
  return parseResponse<{ available: boolean; stock: number }>(res)
}
