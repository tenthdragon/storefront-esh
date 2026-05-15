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

export interface StorefrontCatalogSection {
  visible: boolean
  title: string
}

export interface StorefrontSections {
  catalog: StorefrontCatalogSection
}

export interface StorefrontSettings {
  version: 1
  updatedAt: string
  items: Record<string, VisibilityRule>
  branding: StorefrontBranding
  sections: StorefrontSections
}

export interface StorefrontPublicSettings {
  branding: StorefrontBranding
  sections: StorefrontSections
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
