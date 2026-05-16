import type {
  MetaPurchaseTrigger,
  StorefrontAnalyticsSettings,
  StoreItemType,
  StorefrontBranding,
  StorefrontHero,
  StorefrontCatalogSection,
  StorefrontEnv,
  StorefrontMetaAnalyticsSettings,
  StorefrontPublicSettings,
  StorefrontTheme,
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
    hero: {
      title: 'Koleksi digital pilihan untuk belajar, bertumbuh, dan membangun langkah berikutnya dengan lebih jelas.',
      subtitle: 'Materi yang dipilih satu per satu untuk membantu Anda bergerak lebih tenang, lebih paham, dan lebih siap menghadapi era baru.',
    },
    sections: {
      catalog: {
        visible: true,
        title: 'Katalog Produk',
      },
    },
    theme: {
      buttonColor: '#b85c38',
      priceLabelColor: '#1f1b16',
    },
    analytics: {
      meta: {
        enabled: false,
        pixelId: '',
        trackViewContent: true,
        trackAddToCart: true,
        trackInitiateCheckout: true,
        trackPurchase: true,
        purchaseTrigger: 'checkout_success',
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
  const hero = normalizeHero(candidate.hero, defaults.hero)
  const sections = normalizeSections(candidate.sections, defaults.sections)
  const theme = normalizeTheme(candidate.theme, defaults.theme)
  const analytics = normalizeAnalytics(candidate.analytics, defaults.analytics)

  return {
    version: 1,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date(0).toISOString(),
    items,
    branding,
    hero,
    sections,
    theme,
    analytics,
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

function normalizeHero(value: unknown, defaults: StorefrontHero): StorefrontHero {
  if (!value || typeof value !== 'object') {
    return defaults
  }

  const candidate = value as Partial<StorefrontHero>
  return {
    title: typeof candidate.title === 'string' ? candidate.title : defaults.title,
    subtitle: typeof candidate.subtitle === 'string' ? candidate.subtitle : defaults.subtitle,
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

function normalizeHexColor(value: string, fallback: string) {
  const trimmed = value.trim()
  const match = trimmed.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  if (!match) {
    return fallback
  }

  const hex = match[1]
  if (hex.length === 3) {
    return `#${hex.split('').map((char) => char + char).join('').toLowerCase()}`
  }

  return `#${hex.toLowerCase()}`
}

function normalizeTheme(value: unknown, defaults: StorefrontTheme): StorefrontTheme {
  if (!value || typeof value !== 'object') {
    return defaults
  }

  const candidate = value as Partial<StorefrontTheme>
  return {
    buttonColor: typeof candidate.buttonColor === 'string'
      ? normalizeHexColor(candidate.buttonColor, defaults.buttonColor)
      : defaults.buttonColor,
    priceLabelColor: typeof candidate.priceLabelColor === 'string'
      ? normalizeHexColor(candidate.priceLabelColor, defaults.priceLabelColor)
      : defaults.priceLabelColor,
  }
}

function normalizePurchaseTrigger(
  value: unknown,
  fallback: MetaPurchaseTrigger,
): MetaPurchaseTrigger {
  return value === 'order_paid' || value === 'checkout_success'
    ? value
    : fallback
}

function normalizeMetaAnalytics(
  value: unknown,
  defaults: StorefrontMetaAnalyticsSettings,
): StorefrontMetaAnalyticsSettings {
  if (!value || typeof value !== 'object') {
    return defaults
  }

  const candidate = value as Partial<StorefrontMetaAnalyticsSettings>
  return {
    enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : defaults.enabled,
    pixelId: typeof candidate.pixelId === 'string' ? sanitizeLabel(candidate.pixelId) : defaults.pixelId,
    trackViewContent: typeof candidate.trackViewContent === 'boolean'
      ? candidate.trackViewContent
      : defaults.trackViewContent,
    trackAddToCart: typeof candidate.trackAddToCart === 'boolean'
      ? candidate.trackAddToCart
      : defaults.trackAddToCart,
    trackInitiateCheckout: typeof candidate.trackInitiateCheckout === 'boolean'
      ? candidate.trackInitiateCheckout
      : defaults.trackInitiateCheckout,
    trackPurchase: typeof candidate.trackPurchase === 'boolean'
      ? candidate.trackPurchase
      : defaults.trackPurchase,
    purchaseTrigger: normalizePurchaseTrigger(candidate.purchaseTrigger, defaults.purchaseTrigger),
  }
}

function normalizeAnalytics(
  value: unknown,
  defaults: StorefrontAnalyticsSettings,
): StorefrontAnalyticsSettings {
  if (!value || typeof value !== 'object') {
    return defaults
  }

  const candidate = value as Partial<StorefrontAnalyticsSettings>
  return {
    meta: normalizeMetaAnalytics(candidate.meta, defaults.meta),
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

export function toPublicSettings(settings: StorefrontSettings): StorefrontPublicSettings {
  return {
    branding: settings.branding,
    hero: settings.hero,
    sections: settings.sections,
    theme: settings.theme,
    analytics: settings.analytics,
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
    heroTitle?: string
    heroSubtitle?: string
    catalogVisible?: boolean
    catalogTitle?: string
    buttonColor?: string
    priceLabelColor?: string
    metaEnabled?: boolean
    metaPixelId?: string
    metaTrackViewContent?: boolean
    metaTrackAddToCart?: boolean
    metaTrackInitiateCheckout?: boolean
    metaTrackPurchase?: boolean
    metaPurchaseTrigger?: MetaPurchaseTrigger
  },
) {
  const settings = await loadSettings(env)
  const nextSettings: StorefrontSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
    branding: {
      ...settings.branding,
    },
    hero: {
      ...settings.hero,
    },
    sections: {
      ...settings.sections,
      catalog: {
        ...settings.sections.catalog,
      },
    },
    theme: {
      ...settings.theme,
    },
    analytics: {
      ...settings.analytics,
      meta: {
        ...settings.analytics.meta,
      },
    },
  }

  if (typeof values.storeName === 'string') {
    nextSettings.branding.storeName = sanitizeLabel(values.storeName)
  }

  if (typeof values.heroTitle === 'string') {
    nextSettings.hero.title = sanitizeLabel(values.heroTitle)
  }

  if (typeof values.heroSubtitle === 'string') {
    nextSettings.hero.subtitle = sanitizeLabel(values.heroSubtitle)
  }

  if (typeof values.catalogVisible === 'boolean') {
    nextSettings.sections.catalog.visible = values.catalogVisible
  }

  if (typeof values.catalogTitle === 'string') {
    nextSettings.sections.catalog.title = sanitizeLabel(values.catalogTitle)
  }

  if (typeof values.buttonColor === 'string') {
    nextSettings.theme.buttonColor = normalizeHexColor(values.buttonColor, settings.theme.buttonColor)
  }

  if (typeof values.priceLabelColor === 'string') {
    nextSettings.theme.priceLabelColor = normalizeHexColor(values.priceLabelColor, settings.theme.priceLabelColor)
  }

  if (typeof values.metaEnabled === 'boolean') {
    nextSettings.analytics.meta.enabled = values.metaEnabled
  }

  if (typeof values.metaPixelId === 'string') {
    nextSettings.analytics.meta.pixelId = sanitizeLabel(values.metaPixelId)
  }

  if (typeof values.metaTrackViewContent === 'boolean') {
    nextSettings.analytics.meta.trackViewContent = values.metaTrackViewContent
  }

  if (typeof values.metaTrackAddToCart === 'boolean') {
    nextSettings.analytics.meta.trackAddToCart = values.metaTrackAddToCart
  }

  if (typeof values.metaTrackInitiateCheckout === 'boolean') {
    nextSettings.analytics.meta.trackInitiateCheckout = values.metaTrackInitiateCheckout
  }

  if (typeof values.metaTrackPurchase === 'boolean') {
    nextSettings.analytics.meta.trackPurchase = values.metaTrackPurchase
  }

  if (typeof values.metaPurchaseTrigger === 'string') {
    nextSettings.analytics.meta.purchaseTrigger = normalizePurchaseTrigger(
      values.metaPurchaseTrigger,
      settings.analytics.meta.purchaseTrigger,
    )
  }

  await saveSettings(env, nextSettings)
  return nextSettings
}
