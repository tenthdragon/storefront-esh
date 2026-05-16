<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import type { CartItem } from '@/types'

const cart = useCartStore()
const router = useRouter()

onMounted(() => cart.fetchCart())

const subtotal = computed(() => cart.subtotal)

function getCartItemName(item: CartItem) {
  return (
    item.name
    || item.product_name
    || item.variant_name
    || item.bundle_name
    || item.bundle_price_option_name
    || 'Item'
  )
}

function getCartItemImage(item: CartItem) {
  return item.image || item.bundlelines?.[0]?.image || undefined
}

function getCartItemInitial(item: CartItem) {
  return getCartItemName(item).trim().charAt(0).toUpperCase() || 'I'
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price)
}
</script>

<template>
  <section class="cart-page">
    <header class="page-head">
      <span class="eyebrow">Keranjang</span>
      <h1>Ringkasan belanja Anda</h1>
      <p>Periksa kembali item yang ingin Anda lanjutkan ke checkout.</p>
    </header>

    <div v-if="cart.loading" class="state-block">Memuat...</div>
    <div v-else-if="cart.error" class="state-error">{{ cart.error }}</div>

    <div v-else-if="!cart.cart?.items?.length" class="empty-panel">
      <p>Keranjang masih kosong.</p>
      <RouterLink to="/" class="btn-shop">Mulai Belanja</RouterLink>
    </div>

    <div v-else class="cart-layout">
      <div class="items-panel">
        <article v-for="item in cart.cart!.items" :key="item.id" class="cart-item">
          <img v-if="getCartItemImage(item)" :src="getCartItemImage(item)" :alt="getCartItemName(item)" class="item-img" />
          <div v-else class="no-img">{{ getCartItemInitial(item) }}</div>

          <div class="item-info">
            <p class="item-name">{{ getCartItemName(item) }}</p>
            <p class="item-price">{{ formatPrice(Number(item.price ?? 0)) }}</p>
          </div>

          <div class="qty-ctrl">
            <button @click="item.quantity > 1 ? cart.updateItem(item.id, item.quantity - 1) : cart.removeItem(item.id)">-</button>
            <span>{{ item.quantity }}</span>
            <button @click="cart.updateItem(item.id, item.quantity + 1)">+</button>
          </div>

          <button class="remove" @click="cart.removeItem(item.id)">Hapus</button>
        </article>
      </div>

      <aside class="summary-box">
        <span class="eyebrow">Total</span>
        <h2>Ringkasan</h2>
        <div class="sum-row">
          <span>Subtotal ({{ cart.itemCount }} item)</span>
          <span>{{ formatPrice(subtotal) }}</span>
        </div>
        <button class="btn-checkout" @click="router.push('/checkout')">
          Lanjut ke Checkout
        </button>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.cart-page {
  padding-top: 34px;
}

.page-head {
  margin-bottom: 28px;
}

.eyebrow {
  display: inline-block;
  margin-bottom: 10px;
  font-family: var(--sf-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--sf-accent-strong);
}

h1 {
  font-size: clamp(30px, 4vw, 46px);
  font-weight: 500;
  line-height: 1.04;
  letter-spacing: -0.04em;
  margin-bottom: 10px;
}

.page-head p {
  color: var(--sf-ink-soft);
}

.state-block {
  text-align: center;
  color: var(--sf-ink-soft);
  padding: 64px 16px;
}

.state-error {
  background: #fff4ef;
  border: 1px solid var(--sf-accent-soft);
  border-radius: 24px;
  color: var(--sf-accent-strong);
  padding: 18px 20px;
}

.empty-panel {
  display: grid;
  justify-items: center;
  gap: 16px;
  padding: 52px 24px;
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-line);
  border-radius: 24px;
  color: var(--sf-ink-soft);
}

.btn-shop,
.btn-checkout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid var(--sf-accent);
  background: var(--sf-accent);
  color: var(--sf-accent-contrast);
  padding: 14px 20px;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.btn-shop:hover,
.btn-checkout:hover {
  transform: translateY(-1px);
  background: var(--sf-accent-strong);
  border-color: var(--sf-accent-strong);
}

.cart-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 24px;
  align-items: start;
}

.items-panel,
.summary-box {
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-line);
  border-radius: 24px;
}

.items-panel {
  padding: 18px;
}

.cart-item {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 18px;
  padding: 14px;
  border-radius: 18px;
}

.cart-item + .cart-item {
  border-top: 1px solid var(--sf-line);
}

.item-img,
.no-img {
  width: 84px;
  height: 84px;
  border-radius: 16px;
}

.item-img {
  object-fit: cover;
}

.no-img {
  display: grid;
  place-items: center;
  background: var(--sf-accent-soft);
  color: var(--sf-accent-strong);
  font-size: 28px;
  font-weight: 600;
}

.item-info {
  min-width: 0;
}

.item-name {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 6px;
}

.item-price {
  color: var(--sf-accent-strong);
  font-weight: 700;
}

.qty-ctrl {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--sf-line-strong);
}

.qty-ctrl button {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  border: 1px solid var(--sf-line-strong);
  background: transparent;
  cursor: pointer;
}

.qty-ctrl span {
  min-width: 18px;
  text-align: center;
  font-family: var(--sf-mono);
  font-size: 12px;
}

.remove {
  background: transparent;
  border: none;
  color: var(--sf-ink-muted);
  cursor: pointer;
  font-size: 13px;
}

.remove:hover {
  color: var(--sf-accent-strong);
}

.summary-box {
  position: sticky;
  top: 96px;
  padding: 24px;
  display: grid;
  gap: 16px;
}

.summary-box h2 {
  font-size: 24px;
  letter-spacing: -0.03em;
}

.sum-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: var(--sf-ink-soft);
}

@media (max-width: 920px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .cart-item {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .qty-ctrl,
  .remove {
    grid-column: 2;
    width: fit-content;
  }

  .item-img,
  .no-img {
    width: 72px;
    height: 72px;
  }
}
</style>
