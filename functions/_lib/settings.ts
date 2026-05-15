import type {
  StoreItemType,
  StorefrontBranding,
  StorefrontCatalogSection,
  StorefrontEnv,
  StorefrontPublicSettings,
  StorefrontSections,
  StorefrontSettings,
  VisibilityRule,
} from './types'

const SETTINGS_KEY = 'catalog-visibility:v1'

function createDefaultSettings(): StorefrontSettings {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    items: {},
    branding: {
      storeName: '',
    },
    sections: {
      catalog: {
        visible: true,
        title: 'Katalog Produk',
      },
    },
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
  const defaults = createDefaultSettings()
  const items: Record<string, VisibilityRule> = {}

  if (candidate.items && typeof candidate.items === 'object') {
    for (const [key, rule] of Object.entries(candidate.items)) {
      if (isVisibilityRule(rule)) {
        items[key] = rule
      }
    }
  }

  const branding = normalizeBranding(candidate.branding, defaults.branding)
  const sections = normalizeSections(candidate.sections, defaults.sections)

  return {
    version: 1,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date(0).toISOString(),
    items,
    branding,
    sections,
  }
}

function normalizeBranding(value: unknown, defaults: StorefrontBranding): StorefrontBranding {
  if (!value || typeof value !== 'object') {
    return defaults
  }

  const candidate = value as Partial<StorefrontBranding>
  return {
    storeName: typeof candidate.storeName === 'string' ? candidate.storeName : defaults.storeName,
  }
}

function normalizeCatalogSection(value: unknown, defaults: StorefrontCatalogSection): StorefrontCatalogSection {
  if (!value || typeof value !== 'object') {
    return defaults
  }

  const candidate = value as Partial<StorefrontCatalogSection>
  return {
    visible: typeof candidate.visible === 'boolean' ? candidate.visible : defaults.visible,
    title: typeof candidate.title === 'string' ? candidate.title : defaults.title,
  }
}

function normalizeSections(value: unknown, defaults: StorefrontSections): StorefrontSections {
  if (!value || typeof value !== 'object') {
    return defaults
  }

  const candidate = value as Partial<StorefrontSections>
  return {
    catalog: normalizeCatalogSection(candidate.catalog, defaults.catalog),
  }
}

function sanitizeLabel(value: string) {
  return value.trim()
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

export function toPublicSettings(settings: StorefrontSettings): StorefrontPublicSettings {
  return {
    branding: settings.branding,
    sections: settings.sections,
  }
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

export async function setPresentation(
  env: StorefrontEnv,
  values: {
    storeName?: string
    catalogVisible?: boolean
    catalogTitle?: string
  },
) {
  const settings = await loadSettings(env)
  const nextSettings: StorefrontSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
    branding: {
      ...settings.branding,
    },
    sections: {
      ...settings.sections,
      catalog: {
        ...settings.sections.catalog,
      },
    },
  }

  if (typeof values.storeName === 'string') {
    nextSettings.branding.storeName = sanitizeLabel(values.storeName)
  }

  if (typeof values.catalogVisible === 'boolean') {
    nextSettings.sections.catalog.visible = values.catalogVisible
  }

  if (typeof values.catalogTitle === 'string') {
    nextSettings.sections.catalog.title = sanitizeLabel(values.catalogTitle)
  }

  await saveSettings(env, nextSettings)
  return nextSettings
}
