export interface Item {
  id: number
  slug: string
  name: string
  description?: string
  entity_type: 'product' | 'bundle_price_option'
  images: string[]
  price_range: { min: string; max: string }
  in_stock: boolean
}

export interface ProductVariant {
  id: number
  name: string
  price: number
  original_price?: number
  sku?: string
  image?: string
}

export interface Product {
  id: number
  slug: string
  name: string
  description?: string
  images: string[]
  variants: ProductVariant[]
}

export interface Bundle {
  id: number
  slug: string
  name: string
  description?: string
  images: string[]
  price: number
  original_price?: number
}

export interface CartItem {
  id: number
  type: 'variant' | 'bundle_price_option'
  name: string
  image?: string
  price: number
  quantity: number
  variant_id?: number
  bundle_price_option_id?: number
}

export interface Cart {
  items: CartItem[]
  subtotal: number
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

export interface Summary {
  product_price: number
  product_discount: number
  shipping_cost: number
  shipping_discount: number
  gross_revenue: number
}

export interface PaymentAccount {
  bank_name: string
  account_number: string
  account_name: string
}

export interface Order {
  id: number
  secret_slug: string
  status: string
  customer_name: string
  customer_email: string
  items: CartItem[]
  product_price: number
  product_discount: number
  shipping_cost: number
  shipping_discount: number
  gross_revenue: number
  payment_method: string
  payment_url?: string
  chat_message?: string
  store: {
    payment_accounts: PaymentAccount[]
  }
}
