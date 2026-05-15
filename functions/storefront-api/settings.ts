import { json } from '../_lib/http'
import { loadSettings, toPublicSettings } from '../_lib/settings'
import type { StorefrontEnv } from '../_lib/types'

export const onRequestGet: PagesFunction<StorefrontEnv> = async (context) => {
  const settings = await loadSettings(context.env)
  return json(toPublicSettings(settings))
}
