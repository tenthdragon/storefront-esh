import type { Item, StorefrontPublicSettings } from '@/types'

export function getVisibilityKey(entityType: Item['entity_type'], id: number) {
  return `${entityType}:${id}`
}

export function isItemVisible(
  settings: Pick<StorefrontPublicSettings, 'hiddenItemKeys'>,
  entityType: Item['entity_type'],
  id: number,
) {
  return !settings.hiddenItemKeys.includes(getVisibilityKey(entityType, id))
}
