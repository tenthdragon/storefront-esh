<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProduct, getBundle } from '@/api/catalog'
import { useCartStore } from '@/stores/cart'
import { useAnalyticsStore } from '@/stores/analytics'
import type { Product, Bundle, ProductVariant } from '@/types'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const analytics = useAnalyticsStore()

const isBundle = computed(() => route.name === 'bundle')
const slug = computed(() => route.params.slug as string)

const product = ref<Product | null>(null)
const bundle = ref<Bundle | null>(null)
const selectedVariant = ref<ProductVariant | null>(null)
const quantity = ref(1)
const loading = ref(false)
const addingToCart = ref(false)
const error = ref<string | null>(null)

const productCardEl = ref<HTMLElement | null>(null)
const isCardVisible = ref(true)
let cardObserver: IntersectionObserver | null = null
let lastTrackedViewKey = ''

watch(productCardEl, (el) => {
  cardObserver?.disconnect()
  if (!el) return
  cardObserver = new IntersectionObserver(([entry]) => {
    isCardVisible.value = entry.isIntersecting
  }, { threshold: 0 })
  cardObserver.observe(el)
})

onBeforeUnmount(() => cardObserver?.disconnect())

const canBuy = computed(() => {
  if (isBundle.value) return !!bundle.value
  return !!product.value?.variants.length
})

async function loadItem() {
  loading.value = true
  error.value = null
  try {
    product.value = null
    bundle.value = null
    selectedVariant.value = null

    if (isBundle.value) {
      bundle.value = await getBundle(slug.value)
    } else {
      const loadedProduct = await getProduct(slug.value)
      product.value = {
        ...loadedProduct,
        variants: loadedProduct.variants.map((variant) => ({
          ...variant,
          name: variant.name || variant.fullname || loadedProduct.name,
          image: variant.image ?? variant.images?.[0],
        })),
      }
      if (product.value.variants.length > 0) {
        selectedVariant.value = product.value.variants[0]
      }
    }
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadItem()
})

watch([slug, isBundle], () => {
  lastTrackedViewKey = ''
  void loadItem()
})

const currentImage = computed(() => {
  if (isBundle.value) return bundle.value?.images?.[0]
  return selectedVariant.value?.image ?? product.value?.images?.[0]
})

const currentPrice = computed(() => {
  if (isBundle.value) return Number(bundle.value?.price ?? 0)
  return Number(selectedVariant.value?.price ?? 0)
})

const originalPrice = computed(() => {
  if (isBundle.value) return bundle.value?.original_price
  return selectedVariant.value?.original_price
})

const currentName = computed(() => isBundle.value ? bundle.value?.name : product.value?.name)
const currentRichDescription = computed(() => {
  const description = isBundle.value ? bundle.value?.rich_description : product.value?.rich_description
  return description?.trim() ? description : null
})
const currentDescription = computed(() => {
  const description = isBundle.value ? bundle.value?.description : product.value?.description
  return normalizePlainDescription(description)
})

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
      const trackedItem = cart.cart?.items.find((item) =>
        item.type === 'bundle_price_option' && item.bundle_price_option_id === bundle.value?.id)
      void analytics.trackMetaAddToCart(trackedItem ?? null, quantity.value)
    } else if (selectedVariant.value) {
      await cart.addItem({
        type: 'variant',
        variant_id: selectedVariant.value.id,
        quantity: quantity.value,
      })
      const trackedItem = cart.cart?.items.find((item) =>
        item.type === 'variant' && item.variant_id === selectedVariant.value?.id)
      void analytics.trackMetaAddToCart(trackedItem ?? null, quantity.value)
    }
    router.push('/cart')
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    addingToCart.value = false
  }
}

function normalizePlainDescription(description?: string) {
  const normalized = description
    ?.replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return normalized || null
}

watch(
  () => {
    if (isBundle.value && bundle.value) {
      return `bundle:${bundle.value.id}`
    }

    if (product.value && selectedVariant.value) {
      return `product:${product.value.id}:${selectedVariant.value.id}`
    }

    if (product.value) {
      return `product:${product.value.id}`
    }

    return ''
  },
  (key) => {
    if (!key || key === lastTrackedViewKey) return
    lastTrackedViewKey = key

    if (isBundle.value && bundle.value) {
      void analytics.trackMetaViewContentForBundle(bundle.value)
      return
    }

    if (product.value) {
      void analytics.trackMetaViewContentForProduct(product.value, selectedVariant.value)
    }
  },
)
</script>

<template>
  <section class="product-view">
    <RouterLink to="/" class="back-link">&larr; Kembali ke katalog</RouterLink>

    <div v-if="loading" class="state-block">Memuat...</div>
    <div v-else-if="error" class="state-error">{{ error }}</div>

    <div v-else class="detail">
      <h1 class="product-title">{{ currentName }}</h1>

      <aside ref="productCardEl" class="product-card">
        <span class="eyebrow">{{ isBundle ? 'Bundle' : 'Produk Digital' }}</span>

        <div class="card-media">
          <img v-if="currentImage" :src="currentImage" :alt="currentName" class="main-image" />
          <div v-else class="fallback-image">
            <span>{{ currentName }}</span>
          </div>
        </div>

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
      </aside>

      <div v-if="currentRichDescription || currentDescription" class="description">
        <p class="section-label">Deskripsi</p>
        <div v-if="currentRichDescription" v-html="currentRichDescription" />
        <p v-else class="description-copy">{{ currentDescription }}</p>
      </div>
    </div>

    <div
      v-if="!loading && !error && canBuy"
      class="mobile-cta-bar"
      :class="{ visible: !isCardVisible }"
      :aria-hidden="isCardVisible"
    >
      <div class="mobile-cta-price">
        <span v-if="originalPrice && originalPrice > currentPrice" class="original">
          {{ formatPrice(originalPrice) }}
        </span>
        <span class="price">{{ formatPrice(currentPrice) }}</span>
      </div>
      <button
        class="btn-cart mobile-cta-btn"
        :disabled="addingToCart"
        @click="addToCart"
      >
        {{ addingToCart ? 'Menambahkan...' : 'Tambah ke Keranjang' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.product-view {
  padding-top: 34px;
  overflow-x: clip;
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
  grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
  grid-template-areas:
    'title card'
    'desc  card';
  column-gap: 48px;
  row-gap: 32px;
  align-items: start;
}

.product-title {
  grid-area: title;
  font-size: clamp(32px, 3.4vw, 48px);
  line-height: 1.03;
  letter-spacing: -0.045em;
  font-weight: 500;
  min-width: 0;
  overflow-wrap: break-word;
}

.product-card {
  grid-area: card;
  position: sticky;
  top: 24px;
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-line);
  border-radius: 26px;
  padding: 20px;
  display: grid;
  gap: 18px;
  min-width: 0;
}

.card-media {
  position: relative;
  aspect-ratio: 1;
  border-radius: 18px;
  overflow: hidden;
  background: var(--sf-accent-soft);
}

.main-image,
.fallback-image {
  width: 100%;
  height: 100%;
}

.main-image {
  object-fit: cover;
}

.fallback-image {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--sf-accent-soft) 0%, var(--sf-accent-wash) 100%);
  color: var(--sf-ink);
  padding: 24px;
  text-align: center;
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.04em;
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
  grid-area: desc;
  display: grid;
  gap: 14px;
  color: var(--sf-ink);
  font-size: 16px;
  line-height: 1.7;
  max-width: 62ch;
  min-width: 0;
  overflow-wrap: break-word;
}

.description-copy {
  margin: 0;
  white-space: pre-line;
}

.description :deep(> div > * + *) {
  margin-top: 0.9rem;
}

.description :deep(img),
.description :deep(video),
.description :deep(iframe) {
  max-width: 100%;
  height: auto;
  display: block;
}

.description :deep(pre),
.description :deep(code) {
  white-space: pre-wrap;
  word-break: break-word;
}

.description :deep(table) {
  display: block;
  max-width: 100%;
  overflow-x: auto;
}

.description :deep(ul),
.description :deep(ol) {
  padding-left: 1.2em;
}

.description :deep(li) + :deep(li) {
  margin-top: 0.3rem;
}

.mobile-cta-bar {
  display: none;
}

@media (max-width: 900px) {
  .detail {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'title'
      'card'
      'desc';
    column-gap: 0;
  }

  .product-card {
    position: static;
  }

  .product-view {
    padding-bottom: 96px;
  }

  .mobile-cta-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    background: var(--sf-bg-card);
    border-top: 1px solid var(--sf-line);
    box-shadow: 0 -10px 28px -16px rgba(31, 27, 22, 0.22);
    transform: translateY(110%);
    transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 50;
  }

  .mobile-cta-bar.visible {
    transform: translateY(0);
  }

  .mobile-cta-price {
    display: flex;
    flex-direction: column;
    line-height: 1.1;
  }

  .mobile-cta-price .original {
    font-size: 12px;
  }

  .mobile-cta-price .price {
    font-size: 20px;
  }

  .mobile-cta-btn {
    padding: 12px 18px;
    font-size: 14px;
    white-space: nowrap;
  }
}
</style>
