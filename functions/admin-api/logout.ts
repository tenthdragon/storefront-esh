import { json } from '../_lib/http'
import { getExpiredSessionCookieHeader } from '../_lib/session'

export const onRequestPost: PagesFunction = async () => {
  const response = json({ authenticated: false })
  response.headers.append('Set-Cookie', getExpiredSessionCookieHeader())
  return response
}
