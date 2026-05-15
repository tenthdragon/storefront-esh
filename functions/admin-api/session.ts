import { json } from '../_lib/http'
import { getAuthConfigState, isAuthenticated } from '../_lib/session'
import type { StorefrontEnv } from '../_lib/types'

export const onRequestGet: PagesFunction<StorefrontEnv> = async (context) => {
  const { configured } = getAuthConfigState(context.env)

  return json({
    authenticated: configured ? await isAuthenticated(context.request, context.env) : false,
    configured,
  })
}
