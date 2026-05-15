<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { onMounted } from 'vue'

const cart = useCartStore()
onMounted(() => cart.fetchCart())
</script>

<template>
  <nav class="navbar">
    <RouterLink to="/" class="brand">Toko</RouterLink>
    <div class="nav-links">
      <RouterLink to="/">Produk</RouterLink>
      <RouterLink to="/cart" class="cart-link">
        Keranjang
        <span v-if="cart.itemCount > 0" class="badge">{{ cart.itemCount }}</span>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 100;
}

.brand {
  font-size: 1.25rem;
  font-weight: 700;
  text-decoration: none;
  color: #1a1a1a;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-links a {
  text-decoration: none;
  color: #555;
}

.nav-links a:hover {
  color: #1a1a1a;
}

.cart-link {
  position: relative;
}

.badge {
  position: absolute;
  top: -8px;
  right: -12px;
  background: #e53e3e;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 9999px;
  padding: 1px 5px;
  min-width: 18px;
  text-align: center;
}
</style>
