export interface StorefrontEnv {
  STOREFRONT_SETTINGS?: KVNamespace
  ADMIN_PASSWORD?: string
  ADMIN_SESSION_SECRET?: string
}

export type StoreItemType = 'product' | 'bundle_price_option'

export interface VisibilityRule {
  visible: false
  updatedAt: string
}

export interface StorefrontBranding {
  storeName: string
}

export interface StorefrontHero {
  title: string
  subtitle: string
}

export interface StorefrontCatalogSection {
  visible: boolean
  title: string
}

export interface StorefrontSections {
  catalog: StorefrontCatalogSection
}

export interface StorefrontTheme {
  buttonColor: string
  priceLabelColor: string
}

export interface StorefrontCheckoutSettings {
  whatsappNumber: string
  whatsappButtonLabel: string
  allowedPaymentMethods: string[]
}

export type MetaPurchaseTrigger = 'checkout_success' | 'order_paid'

export interface StorefrontMetaAnalyticsSettings {
  enabled: boolean
  pixelId: string
  trackViewContent: boolean
  trackAddToCart: boolean
  trackInitiateCheckout: boolean
  trackPurchase: boolean
  purchaseTrigger: MetaPurchaseTrigger
}

export interface StorefrontAnalyticsSettings {
  meta: StorefrontMetaAnalyticsSettings
}

export interface StorefrontSettings {
  version: 1
  updatedAt: string
  items: Record<string, VisibilityRule>
  branding: StorefrontBranding
  hero: StorefrontHero
  sections: StorefrontSections
  theme: StorefrontTheme
  checkout: StorefrontCheckoutSettings
  analytics: StorefrontAnalyticsSettings
}

export interface StorefrontPublicSettings {
  hiddenItemKeys: string[]
  branding: StorefrontBranding
  hero: StorefrontHero
  sections: StorefrontSections
  theme: StorefrontTheme
  checkout: StorefrontCheckoutSettings
  analytics: StorefrontAnalyticsSettings
}

export interface CatalogItem {
  id: number
  slug: string
  name: string
  description?: string
  entity_type: StoreItemType
  images: string[]
  price_range: { min: string; max: string }
  in_stock: boolean
}
