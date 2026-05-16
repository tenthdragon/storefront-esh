<script setup lang="ts">
import { computed } from 'vue'
import type { Item } from '@/types'

const props = defineProps<{ item: Item }>()
const hasPriceRange = computed(() => {
  const { min, max } = props.item.price_range
  return parseFloat(max) > parseFloat(min)
})

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
      <span v-if="!item.in_stock" class="stock-overlay">Stok Habis</span>
    </div>

    <div class="card-meta">
      <p class="card-title">{{ item.name }}</p>
    </div>

    <div class="card-footer">
      <span class="price-tag">
        {{ formatPrice(item.price_range.min) }}<template v-if="hasPriceRange">+</template>
      </span>
    </div>
  </RouterLink>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-line-strong);
  border-radius: 10px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.2s ease;
  animation: rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.card:hover {
  transform: translateY(-3px);
  border-color: var(--sf-ink);
  box-shadow: 0 12px 28px -16px rgba(31, 27, 22, 0.2);
}

.card-media {
  position: relative;
  aspect-ratio: 1;
  background: var(--sf-accent-soft);
  overflow: hidden;
  border-bottom: 1px solid var(--sf-line-strong);
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
  display: block;
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
  font-size: clamp(20px, 2.6vw, 32px);
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

.stock-overlay {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(31, 27, 22, 0.86);
  color: #faf7f2;
  font-family: var(--sf-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 6px 10px;
  border-radius: 999px;
}

.card-meta {
  padding: 16px 16px 18px;
  flex: 1;
  min-width: 0;
}

.card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.015em;
  color: var(--sf-ink);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: break-word;
}

.card-footer {
  border-top: 1px solid var(--sf-line-strong);
  padding: 12px 16px;
  background: var(--sf-bg-card);
}

.price-tag {
  display: inline-flex;
  align-items: center;
  background: var(--sf-accent);
  color: var(--sf-accent-contrast);
  padding: 6px 16px 6px 10px;
  font-family: var(--sf-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.005em;
  clip-path: polygon(0 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 0 100%);
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
