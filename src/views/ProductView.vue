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
  <div>
    <RouterLink to="/" class="back">&larr; Kembali</RouterLink>

    <div v-if="loading" class="loading">Memuat...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="detail">
      <div class="image-col">
        <img v-if="currentImage" :src="currentImage" :alt="product?.name ?? bundle?.name" class="main-image" />
        <div v-else class="no-image">Tidak ada gambar</div>
      </div>

      <div class="info-col">
        <h1>{{ isBundle ? bundle?.name : product?.name }}</h1>

        <div class="price-wrap">
          <span v-if="originalPrice && originalPrice > currentPrice" class="original">
            {{ formatPrice(originalPrice) }}
          </span>
          <span class="price">{{ formatPrice(currentPrice) }}</span>
        </div>

        <div v-if="!isBundle && product && product.variants.length > 1" class="variants">
          <p class="label">Pilih Varian:</p>
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

        <div class="qty-row">
          <p class="label">Jumlah:</p>
          <div class="qty-ctrl">
            <button @click="quantity = Math.max(1, quantity - 1)">-</button>
            <span>{{ quantity }}</span>
            <button @click="quantity++">+</button>
          </div>
        </div>

        <p v-if="!isBundle && !product?.variants.length" class="no-variant">
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

        <div
          v-if="product?.description ?? bundle?.description"
          class="description"
          v-html="product?.description ?? bundle?.description"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.back {
  display: inline-block;
  margin-bottom: 1.5rem;
  color: #555;
  text-decoration: none;
  font-size: 0.9rem;
}

.loading,
.error {
  text-align: center;
  padding: 4rem;
  color: #888;
}

.error {
  color: #e53e3e;
}

.detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 640px) {
  .detail {
    grid-template-columns: 1fr;
  }
}

.image-col .main-image {
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.no-image {
  aspect-ratio: 1;
  background: #f0f0f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
}

.info-col {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
}

.price-wrap {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.original {
  font-size: 0.9rem;
  color: #aaa;
  text-decoration: line-through;
}

.price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #e53e3e;
}

.label {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.variant-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.variant-btn {
  padding: 0.4rem 0.9rem;
  border: 1px solid #d1d1d1;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
}

.variant-btn.active {
  border-color: #e53e3e;
  background: #fff5f5;
  color: #e53e3e;
}

.qty-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.qty-ctrl {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.qty-ctrl button {
  width: 32px;
  height: 32px;
  border: 1px solid #d1d1d1;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 1rem;
}

.btn-cart {
  padding: 0.75rem;
  background: #e53e3e;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-cart:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.description {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #444;
  border-top: 1px solid #e5e5e5;
  padding-top: 1rem;
}
</style>
