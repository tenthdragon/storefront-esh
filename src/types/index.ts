export interface Item {
  id: number
  slug: string
  name: string
  description?: string
  entity_type: 'product' | 'bundle_price_option'
  item_type?: 'physical' | 'digital' | 'course'
  images: string[]
  price_range: { min: string; max: string }
  in_stock: boolean
}

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

export interface AdminSession {
  authenticated: boolean
  configured: boolean
}

export interface ProductVariant {
  id: number
  unique_id?: string
  item_type?: 'physical' | 'digital' | 'course'
  name: string
  fullname?: string
  price: number | string
  original_price?: number
  sku?: string
  image?: string
  images?: string[]
}

export interface Product {
  id: number
  slug: string
  name: string
  description?: string
  rich_description?: string
  item_type?: 'physical' | 'digital' | 'course'
  images: string[]
  variants: ProductVariant[]
}

export interface Bundle {
  id: number
  slug: string
  name: string
  description?: string
  rich_description?: string
  item_type?: 'physical' | 'digital' | 'course'
  images: string[]
  price: number | string
  original_price?: number
  bundle_price_option_id?: number
  bundle_price_option_unique_id?: string
}

export interface CartBundleLine {
  variant_id: number
  variant_unique_id?: string
  variant_name: string
  product_name: string
  product_slug?: string
  sku?: string | null
  price: string | number
  quantity: number
  image?: string | null
}

export interface CartItem {
  id: number
  type: 'variant' | 'bundle_price_option'
  item_type?: 'physical' | 'digital' | 'course'
  name: string
  image?: string
  price: number | string
  quantity: number
  variant_id?: number
  bundle_price_option_id?: number
  variant_unique_id?: string
  bundle_price_option_unique_id?: string
  variant_name?: string
  product_name?: string
  product_slug?: string
  bundle_name?: string
  bundle_price_option_name?: string
  bundle_price_option_slug?: string
  line_subtotal?: string | number
  bundlelines?: CartBundleLine[]
}

export interface Cart {
  items: CartItem[]
  subtotal?: number | string
  total?: number | string
}

export interface Location {
  id: number
  name: string
  type: string
  province?: string
  city?: string
  subdistrict?: string
}

export interface ShippingOption {
  courier: string
  service: string
  cost: number
  etd?: string
}

export interface PaymentMethodOption {
  code: string
  enabled: boolean
  label: string
  requires_redirect: boolean
}

export interface Summary {
  product_price: number
  product_discount: number
  shipping_cost: number
  shipping_discount: number
  gross_revenue: number
}

export interface PaymentAccount {
  id?: number
  bank_name?: string
  account_number: string
  account_name?: string
  account_holder?: string
  method?: string
  financial_entity?: {
    id?: number
    code?: string
    name?: string
  }
}

export interface Order {
  id: number
  secret_slug: string
  status: string
  payment_status?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  customer?: {
    name?: string
    email?: string
    phone?: string
  }
  destination_address?: {
    name?: string
    phone?: string
    address?: string
    subdistrict?: string
    city?: string
    province?: string
  }
  items: CartItem[]
  product_price: number
  product_discount: number
  shipping_cost: number
  shipping_discount: number
  gross_revenue: number
  unique_code_discount?: number | string
  payment_method: string
  payment_url?: string
  chat_message?: string
  handler_phone?: string
  variants?: unknown
  bundle_price_options?: unknown
  store?: {
    payment_accounts?: PaymentAccount[]
  }
}
