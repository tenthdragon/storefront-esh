<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProduct, getBundle } from '@/api/catalog'
import { useCartStore } from '@/stores/cart'
import type { Product, Bundle, ProductVariant } from '@/types'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()

const isBundle = computed(() => route.name === 'bundle')
const slug = computed(() => route.params.slug as string)

const product = ref<Product | null>(null)
const bundle = ref<Bundle | null>(null)
const selectedVariant = ref<ProductVariant | null>(null)
const quantity = ref(1)
const loading = ref(false)
const addingToCart = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    if (isBundle.value) {
      bundle.value = await getBundle(slug.value)
    } else {
      product.value = await getProduct(slug.value)
      if (product.value.variants.length > 0) {
        selectedVariant.value = product.value.variants[0]
      }
    }
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
})

const currentImage = computed(() => {
  if (isBundle.value) return bundle.value?.images?.[0]
  return selectedVariant.value?.image ?? product.value?.images?.[0]
})

const currentPrice = computed(() => {
  if (isBundle.value) return bundle.value?.price ?? 0
  return selectedVariant.value?.price ?? 0
})

const originalPrice = computed(() => {
  if (isBundle.value) return bundle.value?.original_price
  return selectedVariant.value?.original_price
})

const currentName = computed(() => isBundle.value ? bundle.value?.name : product.value?.name)
const currentDescription = computed(() => isBundle.value ? bundle.value?.description : product.value?.description)

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price)
}

async function addToCart() {
  addingToCart.value = true
  try {
    if (isBundle.value && bundle.value) {
      await cart.addItem({
        type: 'bundle_price_option',
        bundle_price_option_id: bundle.value.id,
        quantity: quantity.value,
      })
    } else if (selectedVariant.value) {
      await cart.addItem({
        type: 'variant',
        variant_id: selectedVariant.value.id,
        quantity: quantity.value,
      })
    }
    router.push('/cart')
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    addingToCart.value = false
  }
}
</script>

<template>
  <section class="product-view">
    <RouterLink to="/" class="back-link">&larr; Kembali ke katalog</RouterLink>

    <div v-if="loading" class="state-block">Memuat...</div>
    <div v-else-if="error" class="state-error">{{ error }}</div>

    <div v-else class="detail">
      <div class="media-panel">
        <img v-if="currentImage" :src="currentImage" :alt="currentName" class="main-image" />
        <div v-else class="fallback-image">
          <span>{{ currentName }}</span>
        </div>
      </div>

      <div class="content-panel">
        <span class="eyebrow">{{ isBundle ? 'Bundle' : 'Produk Digital' }}</span>
        <h1>{{ currentName }}</h1>

        <div class="price-wrap">
          <span v-if="originalPrice && originalPrice > currentPrice" class="original">
            {{ formatPrice(originalPrice) }}
          </span>
          <span class="price">{{ formatPrice(currentPrice) }}</span>
        </div>

        <div v-if="!isBundle && product && product.variants.length > 1" class="section">
          <p class="section-label">Pilih Varian</p>
          <div class="variant-list">
            <button
              v-for="v in product.variants"
              :key="v.id"
              :class="['variant-btn', { active: selectedVariant?.id === v.id }]"
              @click="selectedVariant = v"
            >
              {{ v.name }}
            </button>
          </div>
        </div>

        <div class="section">
          <p class="section-label">Jumlah</p>
          <div class="qty-ctrl">
            <button @click="quantity = Math.max(1, quantity - 1)">-</button>
            <span>{{ quantity }}</span>
            <button @click="quantity++">+</button>
          </div>
        </div>

        <p v-if="!isBundle && !product?.variants.length" class="inline-note">
          Produk ini tidak memiliki varian tersedia.
        </p>

        <button
          v-else
          class="btn-cart"
          :disabled="addingToCart"
          @click="addToCart"
        >
          {{ addingToCart ? 'Menambahkan...' : 'Tambah ke Keranjang' }}
        </button>

        <div v-if="currentDescription" class="description">
          <p class="section-label">Deskripsi</p>
          <div v-html="currentDescription" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.product-view {
  padding-top: 34px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 22px;
  text-decoration: none;
  color: var(--sf-ink-soft);
  font-size: 13px;
}

.state-block {
  text-align: center;
  color: var(--sf-ink-soft);
  padding: 64px 16px;
}

.state-error {
  background: #fff4ef;
  border: 1px solid var(--sf-accent-soft);
  color: var(--sf-accent-strong);
  padding: 18px 20px;
  border-radius: 20px;
}

.detail {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: 36px;
  align-items: start;
}

.media-panel,
.content-panel {
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-line);
  border-radius: 26px;
  overflow: hidden;
}

.media-panel {
  padding: 20px;
}

.main-image,
.fallback-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 20px;
}

.main-image {
  object-fit: cover;
  background: var(--sf-accent-soft);
}

.fallback-image {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--sf-accent-soft) 0%, var(--sf-accent-wash) 100%);
  color: var(--sf-ink);
  padding: 24px;
  text-align: center;
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.04em;
}

.content-panel {
  padding: 28px;
  display: grid;
  gap: 20px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--sf-accent-strong);
  font-family: var(--sf-mono);
}

h1 {
  font-size: clamp(28px, 3vw, 42px);
  line-height: 1.03;
  letter-spacing: -0.045em;
  font-weight: 500;
}

.price-wrap {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.original {
  color: var(--sf-ink-muted);
  text-decoration: line-through;
  font-size: 15px;
}

.price {
  font-size: 28px;
  font-weight: 700;
  color: var(--sf-accent-strong);
  letter-spacing: -0.04em;
}

.section {
  display: grid;
  gap: 12px;
}

.section-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--sf-ink-soft);
  font-family: var(--sf-mono);
}

.variant-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.variant-btn,
.qty-ctrl button {
  border-radius: 999px;
  border: 1px solid var(--sf-line-strong);
  background: transparent;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.variant-btn {
  padding: 10px 14px;
  font-size: 13px;
  color: var(--sf-ink-soft);
}

.variant-btn.active,
.variant-btn:hover {
  border-color: var(--sf-accent);
  color: var(--sf-accent-strong);
  background: var(--sf-accent-wash);
}

.qty-ctrl {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--sf-line);
  width: fit-content;
  background: #fffdf9;
}

.qty-ctrl button {
  width: 34px;
  height: 34px;
  color: var(--sf-ink);
}

.qty-ctrl button:hover {
  border-color: var(--sf-ink);
}

.qty-ctrl span {
  min-width: 18px;
  text-align: center;
  font-family: var(--sf-mono);
}

.inline-note {
  color: var(--sf-ink-soft);
  font-size: 14px;
}

.btn-cart {
  padding: 14px 22px;
  border-radius: 999px;
  border: 1px solid var(--sf-accent);
  background: var(--sf-accent);
  color: var(--sf-accent-contrast);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
  width: fit-content;
}

.btn-cart:hover:not(:disabled) {
  transform: translateY(-1px);
  background: var(--sf-accent-strong);
  border-color: var(--sf-accent-strong);
}

.btn-cart:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.description {
  padding-top: 22px;
  border-top: 1px solid var(--sf-line);
  color: var(--sf-ink-soft);
  line-height: 1.75;
}

.description :deep(p) + :deep(p) {
  margin-top: 0.9rem;
}

@media (max-width: 900px) {
  .detail {
    grid-template-columns: 1fr;
  }
}
</style>
