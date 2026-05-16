import { adminStorefrontFetch, parseResponse } from './client'
import type { AdminSession, Item, StorefrontSettings } from '@/types'

async function adminApiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers as HeadersInit)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(`/admin-api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers,
  })
}

export async function getAdminSession() {
  const res = await adminApiFetch('/session')
  return parseResponse<AdminSession>(res)
}

export async function loginAdmin(password: string) {
  const res = await adminApiFetch('/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
  return parseResponse<AdminSession>(res)
}

export async function logoutAdmin() {
  const res = await adminApiFetch('/logout', { method: 'POST' })
  return parseResponse<{ authenticated: boolean }>(res)
}

export async function getStorefrontSettings() {
  const res = await adminApiFetch('/settings')
  return parseResponse<StorefrontSettings>(res)
}

export async function setItemVisibility(
  entityType: Item['entity_type'],
  id: number,
  visible: boolean,
) {
  const res = await adminApiFetch('/settings', {
    method: 'PUT',
    body: JSON.stringify({ entityType, id, visible }),
  })
  return parseResponse<StorefrontSettings>(res)
}

export async function updateStorefrontSettings(payload: {
  branding?: {
    storeName?: string
  }
  hero?: {
    title?: string
    subtitle?: string
  }
  sections?: {
    catalog?: {
      visible?: boolean
      title?: string
    }
  }
  theme?: {
    buttonColor?: string
    priceLabelColor?: string
  }
  checkout?: {
    whatsappNumber?: string
    whatsappButtonLabel?: string
    allowedPaymentMethods?: string[]
  }
  analytics?: {
    meta?: {
      enabled?: boolean
      pixelId?: string
      trackViewContent?: boolean
      trackAddToCart?: boolean
      trackInitiateCheckout?: boolean
      trackPurchase?: boolean
      purchaseTrigger?: 'checkout_success' | 'order_paid'
    }
  }
}) {
  const res = await adminApiFetch('/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return parseResponse<StorefrontSettings>(res)
}

export async function getAdminItems(params: {
  page?: number
  per_page?: number
  search?: string
} = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.per_page) query.set('per_page', String(params.per_page))
  if (params.search) query.set('search', params.search)

  const res = await adminStorefrontFetch(`/public/items?${query}`)
  return parseResponse<{ data: Item[] }>(res)
}

export async function getAdminItemCount(search?: string) {
  const query = new URLSearchParams()
  if (search) query.set('search', search)

  const res = await adminStorefrontFetch(`/public/items/count?${query}`)
  return parseResponse<{ total: number }>(res)
}
