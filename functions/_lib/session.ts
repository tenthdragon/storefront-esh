import { errorJson } from './http'
import type { StorefrontEnv } from './types'

const SESSION_COOKIE = 'storefront_admin_session'
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 14

interface SessionPayload {
  exp: number
}

function toBase64Url(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function importSigningKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function sign(value: string, secret: string) {
  const key = await importSigningKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return toBase64Url(new Uint8Array(signature))
}

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  for (const chunk of cookieHeader.split(';')) {
    const [cookieName, ...rest] = chunk.trim().split('=')
    if (cookieName === name) {
      return rest.join('=')
    }
  }

  return null
}

function isAuthConfigured(env: StorefrontEnv) {
  return Boolean(env.ADMIN_PASSWORD && env.ADMIN_SESSION_SECRET)
}

export function getSessionCookieHeader(token: string) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DURATION_SECONDS}`
}

export function getExpiredSessionCookieHeader() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

export async function createSessionToken(secret: string) {
  const payload: SessionPayload = {
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  }
  const payloadText = JSON.stringify(payload)
  const payloadEncoded = toBase64Url(new TextEncoder().encode(payloadText))
  const signature = await sign(payloadEncoded, secret)
  return `${payloadEncoded}.${signature}`
}

export async function isAuthenticated(request: Request, env: StorefrontEnv) {
  if (!isAuthConfigured(env) || !env.ADMIN_SESSION_SECRET) {
    return false
  }

  const token = getCookie(request, SESSION_COOKIE)
  if (!token) {
    return false
  }

  const [payloadEncoded, signature] = token.split('.')
  if (!payloadEncoded || !signature) {
    return false
  }

  const expectedSignature = await sign(payloadEncoded, env.ADMIN_SESSION_SECRET)
  if (signature !== expectedSignature) {
    return false
  }

  try {
    const payloadText = new TextDecoder().decode(fromBase64Url(payloadEncoded))
    const payload = JSON.parse(payloadText) as SessionPayload
    return payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export function requireConfiguredAuth(env: StorefrontEnv) {
  if (!isAuthConfigured(env)) {
    return errorJson(503, 'Admin auth belum dikonfigurasi di Cloudflare.')
  }

  return null
}

export async function requireAuthenticatedAdmin(request: Request, env: StorefrontEnv) {
  const configError = requireConfiguredAuth(env)
  if (configError) return configError

  if (!(await isAuthenticated(request, env))) {
    return errorJson(401, 'Akses admin tidak valid atau sudah kedaluwarsa.')
  }

  return null
}

export function getAuthConfigState(env: StorefrontEnv) {
  return {
    configured: isAuthConfigured(env),
  }
}
