import { storefrontFetch, parseResponse } from './client'
import type { Item, Product, Bundle, ProductVariant } from '@/types'

export async function getItemCount() {
  const res = await storefrontFetch('/public/items/count')
  return parseResponse<{ total: number }>(res)
}

export async function getItems(params: {
  page?: number
  per_page?: number
  search?: string
} = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.per_page) query.set('per_page', String(params.per_page))
  if (params.search) query.set('search', params.search)
  const res = await storefrontFetch(`/public/items?${query}`)
  return parseResponse<{ data: Item[] }>(res)
}

export async function getProduct(slug: string) {
  const res = await storefrontFetch(`/public/products/${slug}`)
  return parseResponse<Product>(res)
}

export async function getBundle(slug: string) {
  const res = await storefrontFetch(`/public/bundle-price-options/${slug}`)
  return parseResponse<Bundle>(res)
}

export async function getVariantPricing(ids: number[]) {
  const res = await storefrontFetch(`/public/variants/pricing?ids=${ids.join(',')}`)
  return parseResponse<ProductVariant[]>(res)
}

export async function getVariantAvailability(variantId: number) {
  const res = await storefrontFetch(`/public/variants/${variantId}/availability`)
  return parseResponse<{ available: boolean; stock: number }>(res)
}
