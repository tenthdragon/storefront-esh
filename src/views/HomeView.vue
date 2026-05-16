<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getItems, getItemCount } from '@/api/catalog'
import ProductCard from '@/components/ProductCard.vue'
import { useStorefrontSettingsStore } from '@/stores/storefrontSettings'
import type { Item } from '@/types'

const items = ref<Item[]>([])
const count = ref(0)
const page = ref(1)
const search = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const PER_PAGE = 20
let searchTimer: ReturnType<typeof setTimeout>
const storefrontSettings = useStorefrontSettingsStore()

async function load() {
  loading.value = true
  error.value = null
  try {
    const [data, countData] = await Promise.all([
      getItems({ page: page.value, per_page: PER_PAGE, search: search.value || undefined }),
      getItemCount(search.value || undefined),
    ])
    items.value = data.data
    count.value = countData.total
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(page, load)
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    void load()
  }, 400)
})

const totalPages = computed(() => Math.ceil(count.value / PER_PAGE))
const totalLabel = computed(() => String(count.value).padStart(2, '0'))
</script>

<template>
  <div class="home-view">
    <header class="hero">
      <h1 class="hero-title">{{ storefrontSettings.heroTitle }}</h1>
      <p class="hero-subtitle">{{ storefrontSettings.heroSubtitle }}</p>
    </header>

    <section class="catalog-nav">
      <div class="catalog-tab">
        <span v-if="storefrontSettings.catalogHeadingVisible" class="catalog-tab-label">
          {{ storefrontSettings.catalogHeadingTitle }}
        </span>
        <span class="catalog-tab-count">{{ totalLabel }}</span>
      </div>

      <label class="search-shell">
        <input
          v-model="search"
          type="search"
          placeholder="Cari produk..."
          class="search-input"
        />
      </label>
    </section>

    <section class="catalog-grid-wrap">
      <div v-if="loading" class="state-block">Memuat...</div>

      <div v-else-if="error" class="state-error">
        <strong>Error:</strong> {{ error }}
      </div>

      <div v-else-if="!items.length" class="state-block">Belum ada item yang sedang ditayangkan.</div>

      <div v-else class="grid">
        <ProductCard v-for="item in items" :key="item.slug" :item="item" />
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button :disabled="page === 1" @click="page--">Sebelumnya</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button :disabled="page === totalPages" @click="page++">Berikutnya</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  padding-top: 20px;
}

.hero {
  padding: 76px 0 44px;
}

.hero-title {
  max-width: 24ch;
  font-size: clamp(34px, 4.3vw, 58px);
  font-weight: 500;
  letter-spacing: -0.04em;
  line-height: 1.04;
  margin-bottom: 28px;
  animation: rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  animation-delay: 0.08s;
}

.hero-subtitle {
  max-width: 56ch;
  color: var(--sf-ink-soft);
  font-size: 16px;
  line-height: 1.6;
  letter-spacing: -0.01em;
  animation: rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  animation-delay: 0.18s;
}

.catalog-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 0 18px;
  border-bottom: 1px solid var(--sf-line);
  margin-bottom: 40px;
  animation: rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  animation-delay: 0.26s;
}

.catalog-tab {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--sf-ink);
}

.catalog-tab-label {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.015em;
}

.catalog-tab-count {
  font-family: var(--sf-mono);
  font-size: 11px;
  color: var(--sf-ink-muted);
  letter-spacing: -0.01em;
}

.search-shell {
  width: min(100%, 320px);
}

.search-input {
  width: 100%;
  border: 1px solid var(--sf-line-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--sf-ink);
  padding: 12px 16px;
  font-size: 13px;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.search-input::placeholder {
  color: var(--sf-ink-muted);
}

.search-input:focus {
  outline: none;
  border-color: var(--sf-ink);
  background: var(--sf-bg-card);
}

.catalog-grid-wrap {
  padding-bottom: 24px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 32px;
}

.state-block {
  text-align: center;
  color: var(--sf-ink-soft);
  padding: 64px 16px;
}

.state-error {
  text-align: center;
  background: #fff4ef;
  border: 1px solid var(--sf-accent-soft);
  color: var(--sf-accent-strong);
  padding: 20px 24px;
  border-radius: 20px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 3rem;
  color: var(--sf-ink-soft);
  font-family: var(--sf-mono);
  font-size: 12px;
}

.pagination button {
  border-radius: 999px;
  border: 1px solid var(--sf-line-strong);
  background: var(--sf-bg-card);
  color: var(--sf-ink);
  padding: 12px 18px;
  font-size: 13px;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.pagination button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: var(--sf-ink);
}

.pagination button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
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

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 52px 0 30px;
  }

  .catalog-nav {
    flex-direction: column;
    align-items: stretch;
  }

  .search-shell {
    width: 100%;
  }

  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }
}

@media (max-width: 480px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
