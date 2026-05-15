import { storefrontFetch, parseResponse } from './client'
import type { Cart } from '@/types'

type AddItemPayload =
  | { type: 'variant'; variant_id: number; quantity: number }
  | { type: 'bundle_price_option'; bundle_price_option_id: number; quantity: number }

export async function getCart() {
  const res = await storefrontFetch('/public/cart')
  return parseResponse<Cart>(res)
}

export async function addToCart(item: AddItemPayload) {
  const res = await storefrontFetch('/public/cart/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  return parseResponse<Cart>(res)
}

export async function updateCartItem(itemId: number, quantity: number) {
  const res = await storefrontFetch(`/public/cart/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  })
  return parseResponse<Cart>(res)
}

export async function removeCartItem(itemId: number) {
  const res = await storefrontFetch(`/public/cart/items/${itemId}`, {
    method: 'DELETE',
  })
  return parseResponse<Cart>(res)
}
