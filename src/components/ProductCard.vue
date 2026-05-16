<script setup lang="ts">
import type { Item } from '@/types'

const props = defineProps<{ item: Item }>()

function formatPrice(price: string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(parseFloat(price))
}

function itemBadge(item: Item) {
  return item.entity_type === 'product' ? 'Produk' : 'Bundle'
}

function cardTone(item: Item) {
  const palettes = [
    'tone-1',
    'tone-2',
    'tone-3',
    'tone-4',
    'tone-5',
    'tone-6',
    'tone-7',
    'tone-8',
  ]
  return palettes[item.id % palettes.length]
}
</script>

<template>
  <RouterLink
    :to="item.entity_type === 'product' ? `/products/${item.slug}` : `/bundles/${item.slug}`"
    class="card"
  >
    <div class="card-media">
      <img v-if="item.images[0]" :src="item.images[0]" :alt="item.name" class="media-image" />
      <div v-else :class="['fallback-art', cardTone(props.item)]">
        <div class="fallback-copy">
          <span class="fallback-badge">{{ itemBadge(item) }}</span>
          <strong>{{ item.name }}</strong>
        </div>
      </div>
    </div>

    <div class="card-meta">
      <p class="card-title">{{ item.name }}</p>
      <div class="card-row">
        <span class="price-text">{{ formatPrice(item.price_range.min) }}</span>
        <span class="card-stock">{{ item.in_stock ? 'Tersedia' : 'Stok Habis' }}</span>
      </div>
    </div>
  </RouterLink>
</template>

<style scoped>
.card {
  display: block;
  text-decoration: none;
  color: inherit;
  transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1);
  animation: rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.card:hover {
  transform: translateY(-4px);
}

.card-media {
  position: relative;
  aspect-ratio: 1;
  border-radius: 18px;
  overflow: hidden;
  background: var(--sf-accent-soft);
  margin-bottom: 16px;
}

.card-media::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 18px;
  border: 1px solid rgba(31, 27, 22, 0.06);
  pointer-events: none;
}

.media-image,
.fallback-art {
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.card:hover .media-image,
.card:hover .fallback-art {
  transform: scale(1.04);
}

.media-image {
  object-fit: cover;
}

.fallback-art {
  display: grid;
  place-items: center;
  padding: 24px;
}

.fallback-copy {
  display: grid;
  gap: 10px;
  text-align: center;
  max-width: 18ch;
  color: #faf7f2;
}

.fallback-copy strong {
  font-size: clamp(24px, 3vw, 38px);
  line-height: 0.95;
  letter-spacing: -0.045em;
}

.fallback-badge {
  font-family: var(--sf-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.78;
}

.tone-1 { background: linear-gradient(135deg, #e8d5c4 0%, #d4b89f 100%); color: var(--sf-ink); }
.tone-1 .fallback-copy { color: var(--sf-ink); }
.tone-2 { background: linear-gradient(135deg, #2d3e2f 0%, #4a5e3f 100%); }
.tone-3 { background: linear-gradient(135deg, #f4e4c8 0%, #e8c89a 100%); }
.tone-3 .fallback-copy { color: var(--sf-ink); }
.tone-4 { background: linear-gradient(135deg, var(--sf-accent) 0%, var(--sf-accent-strong) 100%); }
.tone-5 { background: linear-gradient(135deg, #e8d5c4 0%, #c9a98a 100%); }
.tone-5 .fallback-copy { color: var(--sf-ink); }
.tone-6 { background: linear-gradient(180deg, #d4926f 0%, #a36a4a 100%); }
.tone-7 { background: linear-gradient(135deg, #1f1b16 0%, #3d342a 100%); }
.tone-8 { background: linear-gradient(135deg, #c9b896 0%, #a89572 100%); }
.tone-8 .fallback-copy { color: var(--sf-ink); }

.card-meta {
  padding: 0 4px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.32;
  letter-spacing: -0.02em;
  color: var(--sf-ink);
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.price-text,
.card-stock {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-family: var(--sf-mono);
}

.price-text {
  color: var(--sf-price-bg);
  font-size: 13px;
  letter-spacing: -0.01em;
  text-transform: none;
  font-weight: 500;
}

.card-stock {
  color: var(--sf-ink-muted);
  background: rgba(255, 255, 255, 0.66);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
