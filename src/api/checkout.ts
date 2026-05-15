import { storefrontFetch, parseResponse } from './client'
import type { Location, ShippingOption, Summary, Order } from '@/types'

export async function searchLocations(search: string) {
  const res = await storefrontFetch(`/public/locations?search=${encodeURIComponent(search)}`)
  return parseResponse<Location[]>(res)
}

export async function getPostalCodes(locationId: number) {
  const res = await storefrontFetch(`/public/locations/${locationId}/postal-codes`)
  return parseResponse<string[]>(res)
}

export interface ShippingOptionsPayload {
  shipping_location_id: number
  shipping_postal_code: string
}

export async function getShippingOptions(payload: ShippingOptionsPayload) {
  const res = await storefrontFetch('/public/checkout/shipping-options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse<ShippingOption[]>(res)
}

export interface SummaryPayload {
  shipping_location_id: number
  shipping_postal_code: string
  shipping_courier: string
  shipping_service: string
}

export async function getCheckoutSummary(payload: SummaryPayload) {
  const res = await storefrontFetch('/public/checkout/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse<Summary>(res)
}

export interface CheckoutPayload {
  customer_name: string
  customer_email: string
  customer_phone: string
  shipping_address: string
  shipping_province: string
  shipping_city: string
  shipping_subdistrict: string
  shipping_postal_code: string
  shipping_location_id: number
  shipping_courier: string
  shipping_service: string
  payment_method: string
}

export async function submitCheckout(payload: CheckoutPayload) {
  const res = await storefrontFetch('/public/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parseResponse<Order>(res)
}

export async function getOrder(secretSlug: string) {
  const res = await storefrontFetch(`/public/orders/${secretSlug}`)
  return parseResponse<Order>(res)
}
