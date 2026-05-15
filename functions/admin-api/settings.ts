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
    sections?: {
      catalog?: {
        visible?: unknown
        title?: unknown
      }
    }
  } | null

  const hasStoreName = !!body?.branding && Object.prototype.hasOwnProperty.call(body.branding, 'storeName')
  const hasCatalogVisible = !!body?.sections?.catalog
    && Object.prototype.hasOwnProperty.call(body.sections.catalog, 'visible')
  const hasCatalogTitle = !!body?.sections?.catalog
    && Object.prototype.hasOwnProperty.call(body.sections.catalog, 'title')

  if (!hasStoreName && !hasCatalogVisible && !hasCatalogTitle) {
    return errorJson(400, 'Payload pengaturan tampilan tidak valid.')
  }

  const storeName = body?.branding?.storeName
  const catalogVisible = body?.sections?.catalog?.visible
  const catalogTitle = body?.sections?.catalog?.title

  if (hasStoreName && typeof storeName !== 'string') {
    return errorJson(400, 'Nama toko harus berupa teks.')
  }

  if (hasCatalogVisible && typeof catalogVisible !== 'boolean') {
    return errorJson(400, 'Status judul katalog harus berupa boolean.')
  }

  if (hasCatalogTitle && typeof catalogTitle !== 'string') {
    return errorJson(400, 'Judul katalog harus berupa teks.')
  }

  try {
    return json(await setPresentation(context.env, {
      storeName: typeof storeName === 'string' ? storeName : undefined,
      catalogVisible: typeof catalogVisible === 'boolean' ? catalogVisible : undefined,
      catalogTitle: typeof catalogTitle === 'string' ? catalogTitle : undefined,
    }))
  } catch (error) {
    return errorJson(500, (error as Error).message)
  }
}
