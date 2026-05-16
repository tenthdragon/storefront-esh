import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Router } from 'vue-router'
import { postMetaAnalyticsEvent } from '@/api/analytics'
import { getScalevGuestToken } from '@/api/client'
import { useStorefrontSettingsStore } from './storefrontSettings'
import type {
  Bundle,
  CartItem,
  MetaPurchaseTrigger,
  Order,
  Product,
  ProductVariant,
} from '@/types'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: (...args: unknown[]) => void
  }
}

interface NormalizedAnalyticsItem {
  type: 'variant' | 'bundle_price_option'
  uniqueId?: string
  fallbackId: string
  quantity: number
  price: number
  name: string
}

interface AnalyticsCustomer {
  name?: string
  email?: string
  phone?: string
  externalId?: string
}

interface PendingPurchaseContext {
  orderId: number
  orderSecretSlug: string
  total: number
  items: NormalizedAnalyticsItem[]
  customer: AnalyticsCustomer
  createdAt: string
}

const META_SCRIPT_ID = 'storefront-meta-pixel'
const META_SENT_EVENTS_KEY = 'sf.meta.sent-events'
const META_PENDING_PURCHASE_PREFIX = 'sf.meta.pending-purchase:'
const META_SESSION_EVENT_PREFIX = 'sf.meta.session-event:'
const META_FBC_KEY = '_fbc'
const META_FBP_KEY = '_fbp'

const initializedMetaPixels = new Set<string>()

function getBrowserWindow() {
  return typeof window === 'undefined' ? null : window
}

function getBrowserDocument() {
  return typeof document === 'undefined' ? null : document
}

function readCookie(name: string) {
  const doc = getBrowserDocument()
  if (!doc) return null

  const match = doc.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name: string, value: string, maxAgeDays = 90) {
  const doc = getBrowserDocument()
  if (!doc) return

  doc.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeDays * 24 * 60 * 60}; SameSite=Lax`
}

function readStorage(storage: Storage | null, key: string) {
  if (!storage) return null

  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(storage: Storage | null, key: string, value: string) {
  if (!storage) return

  try {
    storage.setItem(key, value)
  } catch {
    // Ignore storage write failures.
  }
}

function readJsonStorage<T>(storage: Storage | null, key: string, fallback: T): T {
  const raw = readStorage(storage, key)
  if (!raw) return fallback

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJsonStorage(storage: Storage | null, key: string, value: unknown) {
  writeStorage(storage, key, JSON.stringify(value))
}

function getLocalStorage() {
  const win = getBrowserWindow()
  return win?.localStorage ?? null
}

function getSessionStorage() {
  const win = getBrowserWindow()
  return win?.sessionStorage ?? null
}

function randomToken(length = 10) {
  return Math.random().toString(36).slice(2, 2 + length)
}

function generateEventId(prefix: string) {
  return `${prefix}_${Date.now()}_${randomToken(8)}`
}

function simpleHash(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash).toString(36)
}

function getOrCreateSessionEventId(scope: string, signature: string) {
  const storage = getSessionStorage()
  const key = `${META_SESSION_EVENT_PREFIX}${scope}:${simpleHash(signature)}`
  const existing = readStorage(storage, key)
  if (existing) return existing

  const next = generateEventId(scope)
  writeStorage(storage, key, next)
  return next
}

function readSentMetaEvents() {
  return readJsonStorage<Record<string, string>>(getLocalStorage(), META_SENT_EVENTS_KEY, {})
}

function hasSentMetaEvent(eventId: string) {
  return !!readSentMetaEvents()[eventId]
}

function markMetaEventSent(eventId: string) {
  const sent = readSentMetaEvents()
  sent[eventId] = new Date().toISOString()
  writeJsonStorage(getLocalStorage(), META_SENT_EVENTS_KEY, sent)
}

function isValidPhone(phone?: string) {
  return !!phone && phone.trim().length > 5
}

function normalizePhone(phone?: string) {
  if (!isValidPhone(phone)) return undefined

  const digits = phone?.replace(/\D+/g, '') ?? ''
  if (!digits) return undefined
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

function splitName(name?: string) {
  const trimmed = name?.trim()
  if (!trimmed) {
    return { firstName: undefined, lastName: undefined }
  }

  const parts = trimmed.split(/\s+/)
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ') || undefined,
  }
}

function normalizeCustomer(customer: AnalyticsCustomer = {}) {
  const email = customer.email?.trim().toLowerCase() || undefined
  const phone = normalizePhone(customer.phone)
  const externalId = customer.externalId?.trim() || undefined
  const { firstName, lastName } = splitName(customer.name)

  return {
    ...(firstName ? { fn: firstName } : {}),
    ...(lastName ? { ln: lastName } : {}),
    ...(email ? { em: email } : {}),
    ...(phone ? { ph: phone } : {}),
    ...(externalId ? { external_id: externalId } : {}),
  }
}

function getMetaAttribution() {
  return {
    fbc: readCookie(META_FBC_KEY) ?? readStorage(getLocalStorage(), META_FBC_KEY) ?? undefined,
    fbp: readCookie(META_FBP_KEY) ?? readStorage(getLocalStorage(), META_FBP_KEY) ?? undefined,
  }
}

function syncMetaAttribution() {
  const win = getBrowserWindow()
  if (!win) return

  const url = new URL(win.location.href)
  const fbclid = url.searchParams.get('fbclid')
  if (fbclid) {
    const fbc = `fb.1.${Date.now()}.${fbclid}`
    writeCookie(META_FBC_KEY, fbc)
    writeStorage(getLocalStorage(), META_FBC_KEY, fbc)
  }

  const existingFbp = readCookie(META_FBP_KEY) ?? readStorage(getLocalStorage(), META_FBP_KEY)
  if (!existingFbp) {
    const fbp = `fb.1.${Date.now()}.${Math.floor(Math.random() * 1_000_000_000_000)}`
    writeCookie(META_FBP_KEY, fbp)
    writeStorage(getLocalStorage(), META_FBP_KEY, fbp)
  }
}

function ensureMetaBaseScript() {
  const win = getBrowserWindow()
  const doc = getBrowserDocument()
  if (!win || !doc || win.fbq) return

  const fbq = function (...args: unknown[]) {
    const current = fbq as ((...payload: unknown[]) => void) & {
      callMethod?: (...payload: unknown[]) => void
      queue?: unknown[][]
    }

    if (current.callMethod) {
      current.callMethod(...args)
      return
    }

    current.queue = current.queue ?? []
    current.queue.push(args)
  } as ((...payload: unknown[]) => void) & {
    callMethod?: (...payload: unknown[]) => void
    queue?: unknown[][]
    loaded?: boolean
    version?: string
  }

  fbq.queue = []
  fbq.loaded = true
  fbq.version = '2.0'

  win.fbq = fbq
  win._fbq = fbq

  if (!doc.getElementById(META_SCRIPT_ID)) {
    const script = doc.createElement('script')
    script.id = META_SCRIPT_ID
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    doc.head.appendChild(script)
  }
}

function ensureMetaPixel(pixelId: string) {
  const win = getBrowserWindow()
  if (!win || !pixelId.trim()) return

  ensureMetaBaseScript()

  if (!initializedMetaPixels.has(pixelId)) {
    win.fbq?.('init', pixelId)
    initializedMetaPixels.add(pixelId)
  }
}

function trackMetaPageView() {
  const win = getBrowserWindow()
  win?.fbq?.('track', 'PageView')
}

function normalizeCartItem(item: CartItem, quantityOverride?: number): NormalizedAnalyticsItem | null {
  const quantity = quantityOverride ?? item.quantity
  const price = Number(item.price ?? 0)
  if (!quantity || Number.isNaN(price)) {
    return null
  }

  if (item.type === 'variant') {
    return {
      type: 'variant',
      uniqueId: item.variant_unique_id,
      fallbackId: item.variant_unique_id ?? `variant:${item.variant_id ?? item.id}`,
      quantity,
      price,
      name: item.product_name ?? item.variant_name ?? item.name,
    }
  }

  return {
    type: 'bundle_price_option',
    uniqueId: item.bundle_price_option_unique_id,
    fallbackId: item.bundle_price_option_unique_id ?? `bundle_price_option:${item.bundle_price_option_id ?? item.id}`,
    quantity,
    price,
    name: item.bundle_name ?? item.bundle_price_option_name ?? item.name,
  }
}

function normalizeCartItems(items: CartItem[]) {
  return items
    .map((item) => normalizeCartItem(item))
    .filter((item): item is NormalizedAnalyticsItem => item !== null)
}

function buildMetaParameters(
  items: NormalizedAnalyticsItem[],
  options: {
    contentName?: string
    valueOverride?: number
  } = {},
) {
  const contentIds = items.map((item) => item.uniqueId ?? item.fallbackId)
  const value = options.valueOverride ?? items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const numItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return {
    ...(options.contentName ? { content_name: options.contentName } : {}),
    content_type: items.length > 1 ? 'product_group' : 'product',
    content_ids: contentIds,
    contents: items.map((item) => ({
      id: item.uniqueId ?? item.fallbackId,
      quantity: item.quantity,
      item_price: item.price,
    })),
    currency: 'IDR',
    value,
    num_items: numItems,
  }
}

function buildScalevItems(items: NormalizedAnalyticsItem[]) {
  const variants = items
    .filter((item) => item.type === 'variant' && item.uniqueId)
    .map((item) => ({
      variant_unique_id: item.uniqueId!,
      quantity: item.quantity,
    }))

  const bundlePriceOptions = items
    .filter((item) => item.type === 'bundle_price_option' && item.uniqueId)
    .map((item) => ({
      bundle_price_option_unique_id: item.uniqueId!,
      quantity: item.quantity,
    }))

  return {
    ...(variants.length ? { variants } : {}),
    ...(bundlePriceOptions.length ? { bundle_price_options: bundlePriceOptions } : {}),
  }
}

function persistPendingPurchase(context: PendingPurchaseContext) {
  writeJsonStorage(
    getSessionStorage(),
    `${META_PENDING_PURCHASE_PREFIX}${context.orderSecretSlug}`,
    context,
  )
}

function getPendingPurchase(secretSlug: string) {
  return readJsonStorage<PendingPurchaseContext | null>(
    getSessionStorage(),
    `${META_PENDING_PURCHASE_PREFIX}${secretSlug}`,
    null,
  )
}

function clearPendingPurchase(secretSlug: string) {
  const storage = getSessionStorage()
  if (!storage) return

  try {
    storage.removeItem(`${META_PENDING_PURCHASE_PREFIX}${secretSlug}`)
  } catch {
    // Ignore storage failures.
  }
}

function isPaidStatus(status?: string | null) {
  const normalized = status?.trim().toLowerCase()
  return normalized === 'paid' || normalized === 'settled' || normalized === 'success'
}

export const useAnalyticsStore = defineStore('analytics', () => {
  const storefrontSettings = useStorefrontSettingsStore()
  const bootstrapped = ref(false)
  const bootstrappedPixelId = ref<string | null>(null)

  const metaSettings = computed(() => storefrontSettings.settings.analytics.meta)
  const metaReady = computed(() =>
    metaSettings.value.enabled && metaSettings.value.pixelId.trim().length > 0,
  )
  const activeMetaPixelId = computed(() =>
    metaReady.value ? metaSettings.value.pixelId.trim() : '',
  )

  async function sendMetaEvent(input: {
    eventId: string
    eventName: 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase'
    items: NormalizedAnalyticsItem[]
    customer?: AnalyticsCustomer
    parameters: Record<string, unknown>
  }) {
    if (!metaReady.value || hasSentMetaEvent(input.eventId)) {
      return false
    }

    syncMetaAttribution()
    ensureMetaPixel(metaSettings.value.pixelId.trim())

    const browserPayload = {
      ...input.parameters,
    }

    try {
      getBrowserWindow()?.fbq?.('track', input.eventName, browserPayload, { eventID: input.eventId })
    } catch {
      // Ignore browser pixel failures to avoid blocking checkout flow.
    }

    try {
      await postMetaAnalyticsEvent({
        event_source_url: getBrowserWindow()?.location.href ?? '',
        referrer_url: getBrowserDocument()?.referrer || undefined,
        user_data: {
          country: 'id',
          ...getMetaAttribution(),
          ...normalizeCustomer(input.customer),
        },
        events: [{
          event_id: input.eventId,
          event_name: input.eventName,
          parameters: input.parameters,
        }],
        ...buildScalevItems(input.items),
      })
    } catch (error) {
      console.warn('Meta analytics relay gagal dikirim ke Scalev.', error)
    } finally {
      markMetaEventSent(input.eventId)
    }

    return true
  }

  function bootstrap(router: Router) {
    if (bootstrapped.value) return

    bootstrapped.value = true
    syncMetaAttribution()

    watch(activeMetaPixelId, (pixelId) => {
      if (!pixelId) return

      ensureMetaPixel(pixelId)
      if (bootstrappedPixelId.value !== pixelId) {
        trackMetaPageView()
        bootstrappedPixelId.value = pixelId
      }
    }, { immediate: true })

    router.afterEach(() => {
      syncMetaAttribution()
      if (activeMetaPixelId.value) {
        ensureMetaPixel(activeMetaPixelId.value)
        trackMetaPageView()
      }
    })
  }

  async function trackMetaViewContentForProduct(product: Product, variant: ProductVariant | null) {
    if (!metaSettings.value.trackViewContent) return false

    const price = Number(variant?.price ?? 0)
    const items: NormalizedAnalyticsItem[] = variant ? [{
      type: 'variant',
      uniqueId: variant.unique_id,
      fallbackId: variant.unique_id ?? `variant:${variant.id}`,
      quantity: 1,
      price,
      name: product.name,
    }] : []

    return sendMetaEvent({
      eventId: generateEventId('meta_vc'),
      eventName: 'ViewContent',
      items,
      customer: {
        externalId: getScalevGuestToken() ?? undefined,
      },
      parameters: buildMetaParameters(
        items.length ? items : [{
          type: 'variant',
          fallbackId: `product:${product.id}`,
          quantity: 1,
          price,
          name: product.name,
        }],
        { contentName: product.name },
      ),
    })
  }

  async function trackMetaViewContentForBundle(bundle: Bundle) {
    if (!metaSettings.value.trackViewContent) return false

    const price = Number(bundle.price ?? 0)
    const items: NormalizedAnalyticsItem[] = [{
      type: 'bundle_price_option',
      uniqueId: bundle.bundle_price_option_unique_id,
      fallbackId: bundle.bundle_price_option_unique_id ?? `bundle_price_option:${bundle.id}`,
      quantity: 1,
      price,
      name: bundle.name,
    }]

    return sendMetaEvent({
      eventId: generateEventId('meta_vc'),
      eventName: 'ViewContent',
      items,
      customer: {
        externalId: getScalevGuestToken() ?? undefined,
      },
      parameters: buildMetaParameters(items, { contentName: bundle.name }),
    })
  }

  async function trackMetaAddToCart(item: CartItem | null, quantityAdded: number) {
    if (!metaSettings.value.trackAddToCart || !item) return false

    const normalized = normalizeCartItem(item, quantityAdded)
    if (!normalized) return false

    return sendMetaEvent({
      eventId: generateEventId('meta_atc'),
      eventName: 'AddToCart',
      items: [normalized],
      customer: {
        externalId: getScalevGuestToken() ?? undefined,
      },
      parameters: buildMetaParameters([normalized], {
        contentName: normalized.name,
        valueOverride: normalized.price * quantityAdded,
      }),
    })
  }

  async function trackMetaInitiateCheckout(items: CartItem[], subtotal: number) {
    if (!metaSettings.value.trackInitiateCheckout) return false

    const normalizedItems = normalizeCartItems(items)
    if (!normalizedItems.length) return false

    const signature = `${normalizedItems
      .map((item) => `${item.fallbackId}:${item.quantity}`)
      .join('|')}|${subtotal}`
    const eventId = getOrCreateSessionEventId('meta_ic', signature)

    return sendMetaEvent({
      eventId,
      eventName: 'InitiateCheckout',
      items: normalizedItems,
      customer: {
        externalId: getScalevGuestToken() ?? undefined,
      },
      parameters: buildMetaParameters(normalizedItems, {
        valueOverride: Number(subtotal),
      }),
    })
  }

  async function registerCheckoutPurchase(
    order: Order,
    cartItems: CartItem[],
    customer: AnalyticsCustomer,
  ) {
    const normalizedItems = normalizeCartItems(cartItems)
    const total = Number(order.gross_revenue ?? 0)

    persistPendingPurchase({
      orderId: order.id,
      orderSecretSlug: order.secret_slug,
      total,
      items: normalizedItems,
      customer: {
        ...customer,
        externalId: String(order.id),
      },
      createdAt: new Date().toISOString(),
    })

    if (
      !metaSettings.value.trackPurchase
      || metaSettings.value.purchaseTrigger !== 'checkout_success'
    ) {
      return false
    }

    const eventId = `meta_purchase_${order.secret_slug}`
    const tracked = await sendMetaEvent({
      eventId,
      eventName: 'Purchase',
      items: normalizedItems,
      customer: {
        ...customer,
        externalId: String(order.id),
      },
      parameters: buildMetaParameters(normalizedItems, {
        valueOverride: total,
      }),
    })

    clearPendingPurchase(order.secret_slug)
    return tracked
  }

  async function handleOrderPagePurchase(order: Order) {
    if (
      !metaSettings.value.trackPurchase
      || metaSettings.value.purchaseTrigger !== 'order_paid'
      || !isPaidStatus(order.payment_status ?? order.status)
    ) {
      return false
    }

    const eventId = `meta_purchase_${order.secret_slug}`
    const pending = getPendingPurchase(order.secret_slug)
    const normalizedItems = pending?.items?.length
      ? pending.items
      : normalizeCartItems(order.items ?? [])
    const total = Number(pending?.total ?? order.gross_revenue ?? 0)

    const tracked = await sendMetaEvent({
      eventId,
      eventName: 'Purchase',
      items: normalizedItems,
      customer: {
        name: pending?.customer?.name ?? order.customer_name,
        email: pending?.customer?.email ?? order.customer_email,
        phone: pending?.customer?.phone ?? order.customer_phone,
        externalId: pending?.customer?.externalId ?? String(order.id),
      },
      parameters: buildMetaParameters(normalizedItems, {
        valueOverride: total,
      }),
    })

    clearPendingPurchase(order.secret_slug)
    return tracked
  }

  function shouldHandlePurchaseTrigger(trigger: MetaPurchaseTrigger) {
    return metaSettings.value.purchaseTrigger === trigger
  }

  return {
    metaReady,
    metaSettings,
    bootstrap,
    handleOrderPagePurchase,
    registerCheckoutPurchase,
    shouldHandlePurchaseTrigger,
    trackMetaAddToCart,
    trackMetaInitiateCheckout,
    trackMetaViewContentForBundle,
    trackMetaViewContentForProduct,
  }
})
