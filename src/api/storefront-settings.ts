import { parseResponse } from './client'
import type { StorefrontPublicSettings } from '@/types'

declare global {
  interface Window {
    __STOREFRONT_PUBLIC_SETTINGS__?: StorefrontPublicSettings | null
    __STOREFRONT_PUBLIC_SETTINGS_PROMISE__?: Promise<StorefrontPublicSettings>
  }
}

function getBrowserWindow() {
  return typeof window === 'undefined' ? null : window
}

export async function getPublicStorefrontSettings() {
  const win = getBrowserWindow()

  if (win?.__STOREFRONT_PUBLIC_SETTINGS__) {
    return win.__STOREFRONT_PUBLIC_SETTINGS__
  }

  if (win?.__STOREFRONT_PUBLIC_SETTINGS_PROMISE__) {
    const settings = await win.__STOREFRONT_PUBLIC_SETTINGS_PROMISE__
    win.__STOREFRONT_PUBLIC_SETTINGS__ = settings
    return settings
  }

  const res = await fetch('/storefront-api/settings', {
    headers: {
      Accept: 'application/json',
    },
  })

  const settings = await parseResponse<StorefrontPublicSettings>(res)
  if (win) {
    win.__STOREFRONT_PUBLIC_SETTINGS__ = settings
  }

  return settings
}
