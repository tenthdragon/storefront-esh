<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
const router = useRouter()

onMounted(() => cart.fetchCart())

const subtotal = computed(() => cart.subtotal)

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price)
}
</script>

<template>
  <div>
    <h1>Keranjang Belanja</h1>

    <div v-if="cart.loading" class="loading">Memuat...</div>
    <div v-else-if="!cart.cart?.items.length" class="empty">
      <p>Keranjang kosong.</p>
      <RouterLink to="/" class="btn-shop">Mulai Belanja</RouterLink>
    </div>

    <div v-else class="cart-layout">
      <div class="items">
        <div v-for="item in cart.cart!.items" :key="item.id" class="cart-item">
          <img v-if="item.image" :src="item.image" :alt="item.name" class="item-img" />
          <div v-else class="no-img" />
          <div class="item-info">
            <p class="item-name">{{ item.name }}</p>
            <p class="item-price">{{ formatPrice(item.price) }}</p>
          </div>
          <div class="qty-ctrl">
            <button @click="item.quantity > 1 ? cart.updateItem(item.id, item.quantity - 1) : cart.removeItem(item.id)">-</button>
            <span>{{ item.quantity }}</span>
            <button @click="cart.updateItem(item.id, item.quantity + 1)">+</button>
          </div>
          <button class="remove" @click="cart.removeItem(item.id)">Hapus</button>
        </div>
      </div>

      <div class="summary-box">
        <h2>Ringkasan</h2>
        <div class="sum-row">
          <span>Subtotal ({{ cart.itemCount }} item)</span>
          <span>{{ formatPrice(subtotal) }}</span>
        </div>
        <button class="btn-checkout" @click="router.push('/checkout')">
          Lanjut ke Checkout
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.loading,
.empty {
  text-align: center;
  padding: 4rem;
  color: #888;
}

.btn-shop {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.6rem 1.5rem;
  background: #e53e3e;
  color: #fff;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
}

.cart-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 768px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
}

.item-img {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.no-img {
  width: 72px;
  height: 72px;
  background: #f0f0f0;
  border-radius: 6px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 0.9rem;
  font-weight: 500;
}

.item-price {
  font-size: 0.85rem;
  color: #e53e3e;
  font-weight: 600;
}

.qty-ctrl {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.qty-ctrl button {
  width: 28px;
  height: 28px;
  border: 1px solid #d1d1d1;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.remove {
  background: none;
  border: none;
  color: #888;
  font-size: 0.8rem;
  cursor: pointer;
}

.remove:hover {
  color: #e53e3e;
}

.summary-box {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 1.5rem;
  position: sticky;
  top: 80px;
}

.summary-box h2 {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.sum-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.btn-checkout {
  width: 100%;
  padding: 0.75rem;
  background: #e53e3e;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}
</style>
