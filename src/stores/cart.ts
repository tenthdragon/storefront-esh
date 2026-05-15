import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCart, addToCart, updateCartItem, removeCartItem } from '@/api/cart'
import type { Cart } from '@/types'

type AddItemPayload =
  | { type: 'variant'; variant_id: number; quantity: number }
  | { type: 'bundle_price_option'; bundle_price_option_id: number; quantity: number }

export const useCartStore = defineStore('cart', () => {
  const cart = ref<Cart | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const itemCount = computed(() =>
    cart.value?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
  )

  const subtotal = computed(() => cart.value?.subtotal ?? 0)

  async function fetchCart() {
    loading.value = true
    error.value = null
    try {
      cart.value = await getCart()
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function addItem(item: AddItemPayload) {
    loading.value = true
    error.value = null
    try {
      cart.value = await addToCart(item)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function updateItem(itemId: number, quantity: number) {
    loading.value = true
    error.value = null
    try {
      cart.value = await updateCartItem(itemId, quantity)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function removeItem(itemId: number) {
    loading.value = true
    error.value = null
    try {
      cart.value = await removeCartItem(itemId)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  return { cart, loading, error, itemCount, subtotal, fetchCart, addItem, updateItem, removeItem }
})
