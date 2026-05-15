import type { StoreItemType, StorefrontEnv, StorefrontSettings, VisibilityRule } from './types'

const SETTINGS_KEY = 'catalog-visibility:v1'

function createDefaultSettings(): StorefrontSettings {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    items: {},
  }
}

function isVisibilityRule(value: unknown): value is VisibilityRule {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<VisibilityRule>
  return candidate.visible === false && typeof candidate.updatedAt === 'string'
}

function normalizeSettings(value: unknown): StorefrontSettings {
  if (!value || typeof value !== 'object') {
    return createDefaultSettings()
  }

  const candidate = value as Partial<StorefrontSettings>
  const items: Record<string, VisibilityRule> = {}

  if (candidate.items && typeof candidate.items === 'object') {
    for (const [key, rule] of Object.entries(candidate.items)) {
      if (isVisibilityRule(rule)) {
        items[key] = rule
      }
    }
  }

  return {
    version: 1,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date(0).toISOString(),
    items,
  }
}

export function getItemKey(entityType: StoreItemType, id: number) {
  return `${entityType}:${id}`
}

export function normalizeEntityType(value: string): StoreItemType | null {
  if (value === 'product' || value === 'bundle_price_option') {
    return value
  }

  return null
}

export async function loadSettings(env: StorefrontEnv) {
  if (!env.STOREFRONT_SETTINGS) {
    return createDefaultSettings()
  }

  const raw = await env.STOREFRONT_SETTINGS.get(SETTINGS_KEY, 'json')
  return normalizeSettings(raw)
}

export async function saveSettings(env: StorefrontEnv, settings: StorefrontSettings) {
  if (!env.STOREFRONT_SETTINGS) {
    throw new Error('KV storefront settings belum dibinding ke project ini.')
  }

  await env.STOREFRONT_SETTINGS.put(SETTINGS_KEY, JSON.stringify(settings))
}

export function isVisible(settings: StorefrontSettings, entityType: StoreItemType, id: number) {
  return settings.items[getItemKey(entityType, id)]?.visible !== false
}

export function hasHiddenItems(settings: StorefrontSettings) {
  return Object.keys(settings.items).length > 0
}

export async function setVisibility(
  env: StorefrontEnv,
  entityType: StoreItemType,
  id: number,
  visible: boolean,
) {
  const settings = await loadSettings(env)
  const nextSettings: StorefrontSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
    items: { ...settings.items },
  }

  const key = getItemKey(entityType, id)
  if (visible) {
    delete nextSettings.items[key]
  } else {
    nextSettings.items[key] = {
      visible: false,
      updatedAt: new Date().toISOString(),
    }
  }

  await saveSettings(env, nextSettings)
  return nextSettings
}
