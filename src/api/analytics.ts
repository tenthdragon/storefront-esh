import { storefrontFetch } from './client'

interface MetaAnalyticsPayload {
  event_source_url: string
  referrer_url?: string
  user_data?: Record<string, unknown>
  events: Array<{
    event_id: string
    event_name: string
    parameters: Record<string, unknown>
  }>
  variants?: Array<{
    variant_unique_id: string
    quantity: number
  }>
  bundle_price_options?: Array<{
    bundle_price_option_unique_id: string
    quantity: number
  }>
}

export async function postMetaAnalyticsEvent(payload: MetaAnalyticsPayload) {
  const res = await storefrontFetch('/public/analytics/meta/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (res.status === 204) {
    return
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`)
  }
}
