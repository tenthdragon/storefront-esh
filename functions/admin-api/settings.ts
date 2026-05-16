import { errorJson, json } from '../_lib/http'
import { loadSettings, normalizeEntityType, setPresentation, setVisibility } from '../_lib/settings'
import { requireAuthenticatedAdmin } from '../_lib/session'
import type { StorefrontEnv } from '../_lib/types'

export const onRequestGet: PagesFunction<StorefrontEnv> = async (context) => {
  const authError = await requireAuthenticatedAdmin(context.request, context.env)
  if (authError) return authError

  return json(await loadSettings(context.env))
}

export const onRequestPut: PagesFunction<StorefrontEnv> = async (context) => {
  const authError = await requireAuthenticatedAdmin(context.request, context.env)
  if (authError) return authError

  const body = await context.request.json().catch(() => null) as {
    entityType?: string
    id?: number
    visible?: boolean
  } | null

  const entityType = normalizeEntityType(body?.entityType ?? '')
  if (!entityType || typeof body?.id !== 'number' || typeof body.visible !== 'boolean') {
    return errorJson(400, 'Payload visibility tidak valid.')
  }

  try {
    return json(await setVisibility(context.env, entityType, body.id, body.visible))
  } catch (error) {
    return errorJson(500, (error as Error).message)
  }
}

export const onRequestPatch: PagesFunction<StorefrontEnv> = async (context) => {
  const authError = await requireAuthenticatedAdmin(context.request, context.env)
  if (authError) return authError

  const body = await context.request.json().catch(() => null) as {
    branding?: { storeName?: unknown }
    hero?: {
      title?: unknown
      subtitle?: unknown
    }
    sections?: {
      catalog?: {
        visible?: unknown
        title?: unknown
      }
    }
    theme?: {
      buttonColor?: unknown
      priceLabelColor?: unknown
    }
    checkout?: {
      whatsappNumber?: unknown
      whatsappButtonLabel?: unknown
    }
    analytics?: {
      meta?: {
        enabled?: unknown
        pixelId?: unknown
        trackViewContent?: unknown
        trackAddToCart?: unknown
        trackInitiateCheckout?: unknown
        trackPurchase?: unknown
        purchaseTrigger?: unknown
      }
    }
  } | null

  const hasStoreName = !!body?.branding && Object.prototype.hasOwnProperty.call(body.branding, 'storeName')
  const hasHeroTitle = !!body?.hero && Object.prototype.hasOwnProperty.call(body.hero, 'title')
  const hasHeroSubtitle = !!body?.hero && Object.prototype.hasOwnProperty.call(body.hero, 'subtitle')
  const hasCatalogVisible = !!body?.sections?.catalog
    && Object.prototype.hasOwnProperty.call(body.sections.catalog, 'visible')
  const hasCatalogTitle = !!body?.sections?.catalog
    && Object.prototype.hasOwnProperty.call(body.sections.catalog, 'title')
  const hasButtonColor = !!body?.theme && Object.prototype.hasOwnProperty.call(body.theme, 'buttonColor')
  const hasPriceLabelColor = !!body?.theme && Object.prototype.hasOwnProperty.call(body.theme, 'priceLabelColor')
  const hasCheckoutWhatsappNumber = !!body?.checkout
    && Object.prototype.hasOwnProperty.call(body.checkout, 'whatsappNumber')
  const hasCheckoutWhatsappButtonLabel = !!body?.checkout
    && Object.prototype.hasOwnProperty.call(body.checkout, 'whatsappButtonLabel')
  const hasMetaEnabled = !!body?.analytics?.meta
    && Object.prototype.hasOwnProperty.call(body.analytics.meta, 'enabled')
  const hasMetaPixelId = !!body?.analytics?.meta
    && Object.prototype.hasOwnProperty.call(body.analytics.meta, 'pixelId')
  const hasMetaTrackViewContent = !!body?.analytics?.meta
    && Object.prototype.hasOwnProperty.call(body.analytics.meta, 'trackViewContent')
  const hasMetaTrackAddToCart = !!body?.analytics?.meta
    && Object.prototype.hasOwnProperty.call(body.analytics.meta, 'trackAddToCart')
  const hasMetaTrackInitiateCheckout = !!body?.analytics?.meta
    && Object.prototype.hasOwnProperty.call(body.analytics.meta, 'trackInitiateCheckout')
  const hasMetaTrackPurchase = !!body?.analytics?.meta
    && Object.prototype.hasOwnProperty.call(body.analytics.meta, 'trackPurchase')
  const hasMetaPurchaseTrigger = !!body?.analytics?.meta
    && Object.prototype.hasOwnProperty.call(body.analytics.meta, 'purchaseTrigger')

  if (
    !hasStoreName
    && !hasHeroTitle
    && !hasHeroSubtitle
    && !hasCatalogVisible
    && !hasCatalogTitle
    && !hasButtonColor
    && !hasPriceLabelColor
    && !hasCheckoutWhatsappNumber
    && !hasCheckoutWhatsappButtonLabel
    && !hasMetaEnabled
    && !hasMetaPixelId
    && !hasMetaTrackViewContent
    && !hasMetaTrackAddToCart
    && !hasMetaTrackInitiateCheckout
    && !hasMetaTrackPurchase
    && !hasMetaPurchaseTrigger
  ) {
    return errorJson(400, 'Payload pengaturan tampilan tidak valid.')
  }

  const storeName = body?.branding?.storeName
  const heroTitle = body?.hero?.title
  const heroSubtitle = body?.hero?.subtitle
  const catalogVisible = body?.sections?.catalog?.visible
  const catalogTitle = body?.sections?.catalog?.title
  const buttonColor = body?.theme?.buttonColor
  const priceLabelColor = body?.theme?.priceLabelColor
  const checkoutWhatsappNumber = body?.checkout?.whatsappNumber
  const checkoutWhatsappButtonLabel = body?.checkout?.whatsappButtonLabel
  const metaEnabled = body?.analytics?.meta?.enabled
  const metaPixelId = body?.analytics?.meta?.pixelId
  const metaTrackViewContent = body?.analytics?.meta?.trackViewContent
  const metaTrackAddToCart = body?.analytics?.meta?.trackAddToCart
  const metaTrackInitiateCheckout = body?.analytics?.meta?.trackInitiateCheckout
  const metaTrackPurchase = body?.analytics?.meta?.trackPurchase
  const metaPurchaseTrigger = body?.analytics?.meta?.purchaseTrigger

  if (hasStoreName && typeof storeName !== 'string') {
    return errorJson(400, 'Nama toko harus berupa teks.')
  }

  if (hasHeroTitle && typeof heroTitle !== 'string') {
    return errorJson(400, 'Hero title harus berupa teks.')
  }

  if (hasHeroSubtitle && typeof heroSubtitle !== 'string') {
    return errorJson(400, 'Hero subtitle harus berupa teks.')
  }

  if (hasCatalogVisible && typeof catalogVisible !== 'boolean') {
    return errorJson(400, 'Status judul katalog harus berupa boolean.')
  }

  if (hasCatalogTitle && typeof catalogTitle !== 'string') {
    return errorJson(400, 'Judul katalog harus berupa teks.')
  }

  if (hasButtonColor) {
    if (typeof buttonColor !== 'string') {
      return errorJson(400, 'Warna tombol harus berupa teks.')
    }

    const isHexColor = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(buttonColor.trim())
    if (!isHexColor) {
      return errorJson(400, 'Warna tombol harus berupa kode hex seperti #B85C38.')
    }
  }

  if (hasPriceLabelColor) {
    if (typeof priceLabelColor !== 'string') {
      return errorJson(400, 'Warna label harga harus berupa teks.')
    }

    const isHexColor = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(priceLabelColor.trim())
    if (!isHexColor) {
      return errorJson(400, 'Warna label harga harus berupa kode hex seperti #1F1B16.')
    }
  }

  if (hasCheckoutWhatsappNumber && typeof checkoutWhatsappNumber !== 'string') {
    return errorJson(400, 'Nomor WhatsApp checkout harus berupa teks.')
  }

  if (hasCheckoutWhatsappButtonLabel && typeof checkoutWhatsappButtonLabel !== 'string') {
    return errorJson(400, 'Label tombol WhatsApp checkout harus berupa teks.')
  }

  if (hasMetaEnabled && typeof metaEnabled !== 'boolean') {
    return errorJson(400, 'Status Meta Ads harus berupa boolean.')
  }

  if (hasMetaPixelId && typeof metaPixelId !== 'string') {
    return errorJson(400, 'Meta Pixel ID harus berupa teks.')
  }

  if (hasMetaTrackViewContent && typeof metaTrackViewContent !== 'boolean') {
    return errorJson(400, 'Status ViewContent harus berupa boolean.')
  }

  if (hasMetaTrackAddToCart && typeof metaTrackAddToCart !== 'boolean') {
    return errorJson(400, 'Status AddToCart harus berupa boolean.')
  }

  if (hasMetaTrackInitiateCheckout && typeof metaTrackInitiateCheckout !== 'boolean') {
    return errorJson(400, 'Status InitiateCheckout harus berupa boolean.')
  }

  if (hasMetaTrackPurchase && typeof metaTrackPurchase !== 'boolean') {
    return errorJson(400, 'Status Purchase harus berupa boolean.')
  }

  if (
    hasMetaPurchaseTrigger
    && metaPurchaseTrigger !== 'checkout_success'
    && metaPurchaseTrigger !== 'order_paid'
  ) {
    return errorJson(400, 'Pemicu Purchase Meta harus `checkout_success` atau `order_paid`.')
  }

  try {
    return json(await setPresentation(context.env, {
      storeName: typeof storeName === 'string' ? storeName : undefined,
      heroTitle: typeof heroTitle === 'string' ? heroTitle : undefined,
      heroSubtitle: typeof heroSubtitle === 'string' ? heroSubtitle : undefined,
      catalogVisible: typeof catalogVisible === 'boolean' ? catalogVisible : undefined,
      catalogTitle: typeof catalogTitle === 'string' ? catalogTitle : undefined,
      buttonColor: typeof buttonColor === 'string' ? buttonColor : undefined,
      priceLabelColor: typeof priceLabelColor === 'string' ? priceLabelColor : undefined,
      checkoutWhatsappNumber: typeof checkoutWhatsappNumber === 'string' ? checkoutWhatsappNumber : undefined,
      checkoutWhatsappButtonLabel: typeof checkoutWhatsappButtonLabel === 'string'
        ? checkoutWhatsappButtonLabel
        : undefined,
      metaEnabled: typeof metaEnabled === 'boolean' ? metaEnabled : undefined,
      metaPixelId: typeof metaPixelId === 'string' ? metaPixelId : undefined,
      metaTrackViewContent: typeof metaTrackViewContent === 'boolean' ? metaTrackViewContent : undefined,
      metaTrackAddToCart: typeof metaTrackAddToCart === 'boolean' ? metaTrackAddToCart : undefined,
      metaTrackInitiateCheckout: typeof metaTrackInitiateCheckout === 'boolean'
        ? metaTrackInitiateCheckout
        : undefined,
      metaTrackPurchase: typeof metaTrackPurchase === 'boolean' ? metaTrackPurchase : undefined,
      metaPurchaseTrigger: metaPurchaseTrigger === 'checkout_success' || metaPurchaseTrigger === 'order_paid'
        ? metaPurchaseTrigger
        : undefined,
    }))
  } catch (error) {
    return errorJson(500, (error as Error).message)
  }
}
