import { errorJson, json } from '../_lib/http'
import { createSessionToken, getSessionCookieHeader, requireConfiguredAuth } from '../_lib/session'
import type { StorefrontEnv } from '../_lib/types'

export const onRequestPost: PagesFunction<StorefrontEnv> = async (context) => {
  const configError = requireConfiguredAuth(context.env)
  if (configError) return configError

  const body = await context.request.json().catch(() => null) as { password?: string } | null
  if (!body?.password) {
    return errorJson(400, 'Password admin wajib diisi.')
  }

  if (body.password !== context.env.ADMIN_PASSWORD || !context.env.ADMIN_SESSION_SECRET) {
    return errorJson(401, 'Password admin tidak valid.')
  }

  const token = await createSessionToken(context.env.ADMIN_SESSION_SECRET)
  const response = json({ authenticated: true, configured: true })
  response.headers.append('Set-Cookie', getSessionCookieHeader(token))
  return response
}
