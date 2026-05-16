<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { useStorefrontSettingsStore } from '@/stores/storefrontSettings'
import { computed, onMounted } from 'vue'

const cart = useCartStore()
const storefrontSettings = useStorefrontSettingsStore()

const brandInitial = computed(() => storefrontSettings.storeName.trim().charAt(0).toUpperCase() || 'T')

onMounted(() => cart.fetchCart())
</script>

<template>
  <nav class="nav">
    <div class="nav-inner">
      <RouterLink to="/" class="brand">
        <span class="brand-mark">{{ brandInitial }}</span>
        <span class="brand-name">{{ storefrontSettings.storeName }}</span>
      </RouterLink>

      <div class="nav-actions">
        <div class="nav-links">
          <RouterLink to="/" class="nav-pill">Produk</RouterLink>
        </div>

        <RouterLink to="/cart" class="cart-btn" aria-label="Keranjang">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span v-if="cart.itemCount > 0" class="cart-count">{{ cart.itemCount }}</span>
        </RouterLink>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(250, 247, 242, 0.88);
  border-bottom: 1px solid var(--sf-line);
  backdrop-filter: saturate(180%) blur(14px);
  -webkit-backdrop-filter: saturate(180%) blur(14px);
}

.nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 18px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--sf-ink);
  min-width: 0;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--sf-accent) 0%, var(--sf-accent-strong) 100%);
  color: var(--sf-accent-contrast);
  font-size: 16px;
  font-weight: 600;
  font-style: italic;
  letter-spacing: -0.04em;
  flex-shrink: 0;
}

.brand-name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-pill {
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid var(--sf-line-strong);
  color: var(--sf-ink-soft);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.nav-pill:hover,
.nav-pill.router-link-active {
  color: var(--sf-ink);
  border-color: var(--sf-ink);
  background: var(--sf-accent-wash);
}

.cart-btn {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 1px solid var(--sf-line-strong);
  display: grid;
  place-items: center;
  position: relative;
  text-decoration: none;
  color: var(--sf-ink);
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.cart-btn:hover {
  background: var(--sf-ink);
  color: var(--sf-bg);
  border-color: var(--sf-ink);
}

.cart-count {
  position: absolute;
  top: -3px;
  right: -3px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--sf-accent);
  color: var(--sf-accent-contrast);
  border: 2px solid var(--sf-bg);
  font-size: 10px;
  font-weight: 700;
  display: grid;
  place-items: center;
  font-family: var(--sf-mono);
}

@media (max-width: 768px) {
  .nav-inner {
    padding: 14px 24px;
  }

  .brand-name {
    max-width: 18ch;
  }
}

@media (max-width: 560px) {
  .nav-links {
    display: none;
  }

  .brand-name {
    font-size: 14px;
  }
}
</style>
