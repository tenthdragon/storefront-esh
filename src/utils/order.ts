import type { Order } from '@/types'

function firstNonEmpty(...values: Array<string | undefined>) {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) {
      return trimmed
    }
  }

  return ''
}

export function getOrderCustomerName(order: Order) {
  return firstNonEmpty(
    order.customer_name,
    order.customer?.name,
    order.destination_address?.name,
  )
}

export function getOrderCustomerEmail(order: Order) {
  return firstNonEmpty(
    order.customer_email,
    order.customer?.email,
  )
}

export function getOrderCustomerPhone(order: Order) {
  return firstNonEmpty(
    order.customer_phone,
    order.customer?.phone,
    order.destination_address?.phone,
  )
}
