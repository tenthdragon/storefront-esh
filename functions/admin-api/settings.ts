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

  if (!hasStoreName && !hasHeroTitle && !hasHeroSubtitle && !hasCatalogVisible && !hasCatalogTitle && !hasButtonColor && !hasPriceLabelColor) {
    return errorJson(400, 'Payload pengaturan tampilan tidak valid.')
  }

  const storeName = body?.branding?.storeName
  const heroTitle = body?.hero?.title
  const heroSubtitle = body?.hero?.subtitle
  const catalogVisible = body?.sections?.catalog?.visible
  const catalogTitle = body?.sections?.catalog?.title
  const buttonColor = body?.theme?.buttonColor
  const priceLabelColor = body?.theme?.priceLabelColor

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

  try {
    return json(await setPresentation(context.env, {
      storeName: typeof storeName === 'string' ? storeName : undefined,
      heroTitle: typeof heroTitle === 'string' ? heroTitle : undefined,
      heroSubtitle: typeof heroSubtitle === 'string' ? heroSubtitle : undefined,
      catalogVisible: typeof catalogVisible === 'boolean' ? catalogVisible : undefined,
      catalogTitle: typeof catalogTitle === 'string' ? catalogTitle : undefined,
      buttonColor: typeof buttonColor === 'string' ? buttonColor : undefined,
      priceLabelColor: typeof priceLabelColor === 'string' ? priceLabelColor : undefined,
    }))
  } catch (error) {
    return errorJson(500, (error as Error).message)
  }
}
