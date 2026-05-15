const API_BASE = import.meta.env.DEV ? '/scalev-api' : 'https://api.scalev.com'
const STORE_ID = import.meta.env.VITE_SCALEV_STORE_UNIQUE_ID as string
const STOREFRONT_KEY = import.meta.env.VITE_SCALEV_STOREFRONT_API_KEY as string

function getGuestToken(): string | null {
  return localStorage.getItem('scalev_guest_token')
}

function saveGuestToken(token: string) {
  localStorage.setItem('scalev_guest_token', token)
}

export async function storefrontFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers as HeadersInit)
  headers.set('Accept', 'application/json')
  headers.set('X-Scalev-Storefront-Api-Key', STOREFRONT_KEY)
  const guestToken = getGuestToken()
  if (guestToken) {
    headers.set('X-Scalev-Guest-Token', guestToken)
  }
  const response = await fetch(`${API_BASE}/v3/stores/${STORE_ID}${path}`, {
    ...init,
    credentials: 'omit',
    headers,
  })
  const newToken = response.headers.get('x-scalev-guest-token')
  if (newToken) {
    saveGuestToken(newToken)
  }
  return response
}

export async function customerFetch(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers as HeadersInit)
  headers.set('Accept', 'application/json')
  headers.set('Authorization', `Bearer ${accessToken}`)
  return fetch(`${API_BASE}/v3/stores/${STORE_ID}${path}`, {
    ...init,
    credentials: 'omit',
    headers,
  })
}

export async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}
