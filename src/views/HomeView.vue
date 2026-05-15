<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getItems, getItemCount } from '@/api/catalog'
import ProductCard from '@/components/ProductCard.vue'
import type { Item } from '@/types'

const items = ref<Item[]>([])
const count = ref(0)
const page = ref(1)
const search = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const PER_PAGE = 20
let searchTimer: ReturnType<typeof setTimeout>

async function load() {
  loading.value = true
  error.value = null
  try {
    const [data, countData] = await Promise.all([
      getItems({ page: page.value, per_page: PER_PAGE, search: search.value || undefined }),
      getItemCount(),
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
    load()
  }, 400)
})

const totalPages = computed(() => Math.ceil(count.value / PER_PAGE))
</script>

<template>
  <div>
    <div class="header">
      <h1>Katalog Produk</h1>
      <input
        v-model="search"
        type="search"
        placeholder="Cari produk..."
        class="search-input"
      />
    </div>

    <div v-if="loading" class="loading">Memuat...</div>

    <div v-else-if="error" class="error">
      <strong>Error:</strong> {{ error }}
    </div>

    <div v-else-if="!items.length" class="empty">Tidak ada produk ditemukan.</div>

    <div v-else class="grid">
      <ProductCard v-for="item in items" :key="item.slug" :item="item" />
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="page === 1" @click="page--">Sebelumnya</button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button :disabled="page === totalPages" @click="page++">Berikutnya</button>
    </div>
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
}

.search-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d1d1;
  border-radius: 6px;
  font-size: 0.9rem;
  width: 240px;
}

.error {
  background: #fff5f5;
  border: 1px solid #e53e3e;
  color: #e53e3e;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  text-align: center;
}

.loading,
.empty {
  text-align: center;
  padding: 4rem;
  color: #888;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d1d1;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
