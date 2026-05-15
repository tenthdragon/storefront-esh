import { parseResponse } from './client'
import type { StorefrontPublicSettings } from '@/types'

export async function getPublicStorefrontSettings() {
  const res = await fetch('/storefront-api/settings', {
    headers: {
      Accept: 'application/json',
    },
  })

  return parseResponse<StorefrontPublicSettings>(res)
}
