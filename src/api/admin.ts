import { adminStorefrontFetch, parseResponse } from './client'
import type { AdminSession, Item, ItemVisibilitySettings } from '@/types'

const STORE_ID = import.meta.env.VITE_SCALEV_STORE_UNIQUE_ID as string

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

export async function getVisibilitySettings() {
  const res = await adminApiFetch('/settings')
  return parseResponse<ItemVisibilitySettings>(res)
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
  return parseResponse<ItemVisibilitySettings>(res)
}

export async function getAdminItems(params: {
  page?: number
  per_page?: number
  search?: string
} = {}) {
  const query = new URLSearchParams()
  query.set('admin', '1')
  if (params.page) query.set('page', String(params.page))
  if (params.per_page) query.set('per_page', String(params.per_page))
  if (params.search) query.set('search', params.search)

  const res = await adminStorefrontFetch(`/public/items?${query}`)
  return parseResponse<{ data: Item[] }>(res)
}

export async function getAdminItemCount(search?: string) {
  const query = new URLSearchParams()
  query.set('admin', '1')
  if (search) query.set('search', search)

  const res = await adminStorefrontFetch(`/public/items/count?${query}`)
  return parseResponse<{ total: number }>(res)
}
