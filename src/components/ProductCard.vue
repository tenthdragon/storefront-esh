<script setup lang="ts">
import type { Item } from '@/types'

defineProps<{ item: Item }>()

function formatPrice(price: string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(parseFloat(price))
}
</script>

<template>
  <RouterLink
    :to="item.entity_type === 'product' ? `/products/${item.slug}` : `/bundles/${item.slug}`"
    class="card"
  >
    <div class="image-wrap">
      <img v-if="item.images[0]" :src="item.images[0]" :alt="item.name" />
      <div v-else class="no-image">Tidak ada gambar</div>
    </div>
    <div class="info">
      <p class="name">{{ item.name }}</p>
      <p class="price">{{ formatPrice(item.price_range.min) }}</p>
    </div>
  </RouterLink>
</template>

<style scoped>
.card {
  display: block;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.15s;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.image-wrap {
  aspect-ratio: 1;
  background: #f0f0f0;
  overflow: hidden;
}

.image-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #aaa;
  font-size: 0.85rem;
}

.info {
  padding: 0.75rem;
}

.name {
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.price {
  font-size: 1rem;
  font-weight: 700;
  color: #e53e3e;
}
</style>
