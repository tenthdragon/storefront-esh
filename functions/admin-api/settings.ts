import { errorJson, json } from '../_lib/http'
import { normalizeEntityType, loadSettings, setVisibility } from '../_lib/settings'
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
