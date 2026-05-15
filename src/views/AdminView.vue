<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  getAdminItemCount,
  getAdminItems,
  getStorefrontSettings,
  getAdminSession,
  loginAdmin,
  logoutAdmin,
  setItemVisibility,
  updateStorefrontPresentation,
} from '@/api/admin'
import type { Item, StorefrontSettings } from '@/types'

const items = ref<Item[]>([])
const settings = ref<StorefrontSettings>({
  version: 1,
  updatedAt: new Date(0).toISOString(),
  items: {},
  branding: {
    storeName: '',
  },
  sections: {
    catalog: {
      visible: true,
      title: 'Katalog Produk',
    },
  },
})
const page = ref(1)
const search = ref('')
const count = ref(0)
const loading = ref(false)
const checkingSession = ref(true)
const loggingIn = ref(false)
const authenticated = ref(false)
const configured = ref(true)
const error = ref<string | null>(null)
const authError = ref<string | null>(null)
const password = ref('')
const savingKey = ref<string | null>(null)
const savingPresentation = ref(false)
const presentationError = ref<string | null>(null)
const presentationSaved = ref<string | null>(null)
const storeNameInput = ref('')
const showCatalogHeading = ref(true)
const catalogHeadingInput = ref('Katalog Produk')
const PER_PAGE = 20
let searchTimer: ReturnType<typeof setTimeout>

function itemKey(item: Item) {
  return `${item.entity_type}:${item.id}`
}

function isVisible(item: Item) {
  return settings.value.items[itemKey(item)]?.visible !== false
}

function formatPrice(price: string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(parseFloat(price))
}

function typeLabel(entityType: Item['entity_type']) {
  return entityType === 'product' ? 'Produk' : 'Bundle'
}

function syncPresentationForm() {
  storeNameInput.value = settings.value.branding.storeName
  showCatalogHeading.value = settings.value.sections.catalog.visible
  catalogHeadingInput.value = settings.value.sections.catalog.title
}

async function loadSession() {
  authError.value = null
  try {
    const session = await getAdminSession()
    authenticated.value = session.authenticated
    configured.value = session.configured
  } catch (e) {
    configured.value = false
    authError.value = (e as Error).message
  } finally {
    checkingSession.value = false
  }
}

async function loadCatalog() {
  if (!authenticated.value) return

  loading.value = true
  error.value = null
  try {
    const [itemsData, countData, settingsData] = await Promise.all([
      getAdminItems({ page: page.value, per_page: PER_PAGE, search: search.value || undefined }),
      getAdminItemCount(search.value || undefined),
      getStorefrontSettings(),
    ])

    items.value = itemsData.data
    count.value = countData.total
    settings.value = settingsData
    syncPresentationForm()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function handleLogin() {
  loggingIn.value = true
  authError.value = null

  try {
    const session = await loginAdmin(password.value)
    authenticated.value = session.authenticated
    configured.value = session.configured
    password.value = ''
    page.value = 1
    await loadCatalog()
  } catch (e) {
    authError.value = (e as Error).message
  } finally {
    loggingIn.value = false
  }
}

async function handleLogout() {
  await logoutAdmin()
  authenticated.value = false
  items.value = []
  count.value = 0
  presentationSaved.value = null
  presentationError.value = null
}

async function updateVisibility(item: Item, visible: boolean) {
  const key = itemKey(item)
  savingKey.value = key
  error.value = null

  const previousSettings = settings.value
  settings.value = {
    ...settings.value,
    items: { ...settings.value.items },
  }

  if (visible) {
    delete settings.value.items[key]
  } else {
    settings.value.items[key] = {
      visible: false,
      updatedAt: new Date().toISOString(),
    }
  }

  try {
    settings.value = await setItemVisibility(item.entity_type, item.id, visible)
  } catch (e) {
    settings.value = previousSettings
    error.value = (e as Error).message
  } finally {
    savingKey.value = null
  }
}

async function savePresentation() {
  savingPresentation.value = true
  presentationError.value = null
  presentationSaved.value = null

  try {
    settings.value = await updateStorefrontPresentation({
      branding: {
        storeName: storeNameInput.value,
      },
      sections: {
        catalog: {
          visible: showCatalogHeading.value,
          title: catalogHeadingInput.value,
        },
      },
    })
    syncPresentationForm()
    presentationSaved.value = 'Label storefront berhasil disimpan.'
  } catch (e) {
    presentationError.value = (e as Error).message
  } finally {
    savingPresentation.value = false
  }
}

const totalPages = computed(() => Math.max(1, Math.ceil(count.value / PER_PAGE)))
const visibleCountOnPage = computed(() => items.value.filter((item) => isVisible(item)).length)

onMounted(async () => {
  await loadSession()
  if (authenticated.value) {
    await loadCatalog()
  }
})

watch(page, () => {
  void loadCatalog()
})

watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    void loadCatalog()
  }, 300)
})

watch([storeNameInput, showCatalogHeading, catalogHeadingInput], () => {
  presentationSaved.value = null
})
</script>

<template>
  <section class="admin-shell">
    <header class="page-header">
      <div>
        <p class="eyebrow">Owner Settings</p>
        <h1>Kurasi Storefront</h1>
        <p class="subcopy">
          Pilih item mana yang tampil di storefront publik. Aturan ini tetap tersimpan walau UI storefront
          nanti Anda ubah lagi.
        </p>
      </div>

      <button v-if="authenticated" class="ghost-btn" @click="handleLogout">Keluar</button>
    </header>

    <div v-if="checkingSession" class="panel center">Memeriksa sesi admin...</div>

    <div v-else-if="!configured" class="panel warning">
      <h2>Admin belum dikonfigurasi</h2>
      <p>
        Set secret `ADMIN_PASSWORD` dan `ADMIN_SESSION_SECRET`, lalu bind KV `STOREFRONT_SETTINGS`
        pada project Cloudflare Pages ini.
      </p>
      <p v-if="authError">{{ authError }}</p>
    </div>

    <div v-else-if="!authenticated" class="login-wrap">
      <form class="panel login-panel" @submit.prevent="handleLogin">
        <h2>Masuk sebagai pemilik</h2>
        <p class="subcopy">Halaman ini hanya untuk mengatur item yang ditayangkan di storefront.</p>

        <label class="field">
          <span>Password admin</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="Masukkan password admin"
          />
        </label>

        <p v-if="authError" class="error-text">{{ authError }}</p>

        <button class="primary-btn" :disabled="loggingIn || !password">
          {{ loggingIn ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>
    </div>

    <template v-else>
      <form class="panel settings-panel" @submit.prevent="savePresentation">
        <div class="settings-copy">
          <p class="eyebrow">Branding & Labels</p>
          <h2>Teks storefront publik</h2>
          <p class="subcopy">
            Atur nama toko di navbar dan tentukan apakah judul section katalog ditampilkan atau disembunyikan.
          </p>
        </div>

        <div class="settings-grid">
          <label class="field">
            <span>Nama toko</span>
            <input
              v-model="storeNameInput"
              type="text"
              placeholder="Misalnya: Army Alghifari"
            />
          </label>

          <label class="field checkbox-field">
            <span>Tampilkan judul katalog</span>
            <input v-model="showCatalogHeading" type="checkbox" />
          </label>

          <label class="field">
            <span>Judul katalog</span>
            <input
              v-model="catalogHeadingInput"
              type="text"
              :disabled="!showCatalogHeading"
              placeholder="Misalnya: Katalog Produk"
            />
          </label>

          <div class="preview-card">
            <p class="stat-label">Preview singkat</p>
            <strong>{{ storeNameInput.trim() || 'Toko' }}</strong>
            <span>
              {{
                showCatalogHeading
                  ? catalogHeadingInput.trim() || 'Katalog Produk'
                  : 'Judul katalog disembunyikan'
              }}
            </span>
          </div>
        </div>

        <div class="settings-actions">
          <p v-if="presentationError" class="error-text">{{ presentationError }}</p>
          <p v-else-if="presentationSaved" class="success-text">{{ presentationSaved }}</p>

          <button class="primary-btn" :disabled="savingPresentation">
            {{ savingPresentation ? 'Menyimpan...' : 'Simpan Label' }}
          </button>
        </div>
      </form>

      <div class="panel controls">
        <div>
          <p class="stat-label">Item pada halaman ini</p>
          <strong>{{ visibleCountOnPage }} terlihat / {{ items.length }} item</strong>
        </div>

        <label class="search-box">
          <span>Cari item</span>
          <input
            v-model="search"
            type="search"
            placeholder="Cari nama produk atau bundle"
          />
        </label>
      </div>

      <div v-if="loading" class="panel center">Memuat katalog owner...</div>

      <div v-else-if="error" class="panel error-panel">
        <strong>Error:</strong> {{ error }}
      </div>

      <div v-else-if="!items.length" class="panel center">Tidak ada item ditemukan.</div>

      <div v-else class="catalog-list">
        <article v-for="item in items" :key="itemKey(item)" class="panel item-row">
          <div class="item-main">
            <div class="thumb">
              <img v-if="item.images[0]" :src="item.images[0]" :alt="item.name" />
              <span v-else>Tidak ada gambar</span>
            </div>

            <div class="item-copy">
              <div class="meta-row">
                <span class="type-chip">{{ typeLabel(item.entity_type) }}</span>
                <span v-if="!item.in_stock" class="stock-chip">Stok habis</span>
              </div>
              <h2>{{ item.name }}</h2>
              <p class="price">{{ formatPrice(item.price_range.min) }}</p>
              <p class="slug">{{ item.slug }}</p>
            </div>
          </div>

          <label class="toggle-wrap">
            <input
              :checked="isVisible(item)"
              type="checkbox"
              :disabled="savingKey === itemKey(item)"
              @change="updateVisibility(item, ($event.target as HTMLInputElement).checked)"
            />
            <span>{{ isVisible(item) ? 'Tayang' : 'Disembunyikan' }}</span>
          </label>
        </article>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button :disabled="page === 1 || loading" @click="page--">Sebelumnya</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button :disabled="page === totalPages || loading" @click="page++">Berikutnya</button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.admin-shell {
  display: grid;
  gap: 1rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.4rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 0.4rem;
}

.subcopy {
  color: #475569;
  max-width: 60ch;
  line-height: 1.5;
}

.panel {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1rem;
}

.center {
  text-align: center;
  padding: 2rem 1rem;
  color: #64748b;
}

.warning {
  background: #fff7ed;
  border-color: #fdba74;
}

.login-wrap {
  display: flex;
  justify-content: center;
}

.login-panel {
  width: min(100%, 420px);
  display: grid;
  gap: 1rem;
}

.field {
  display: grid;
  gap: 0.5rem;
}

.field span,
.search-box span,
.stat-label {
  font-size: 0.85rem;
  color: #64748b;
}

.field input,
.search-box input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0.75rem 0.85rem;
  font: inherit;
}

.primary-btn,
.ghost-btn,
.pagination button {
  border-radius: 999px;
  border: 1px solid #0f172a;
  padding: 0.75rem 1rem;
  font: inherit;
  cursor: pointer;
}

.primary-btn {
  background: #0f172a;
  color: #fff;
}

.ghost-btn,
.pagination button {
  background: #fff;
  color: #0f172a;
}

.primary-btn:disabled,
.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-text,
.error-panel {
  color: #b91c1c;
}

.success-text {
  color: #15803d;
}

.settings-panel {
  display: grid;
  gap: 1rem;
}

.settings-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  align-items: start;
}

.checkbox-field {
  align-content: start;
}

.checkbox-field input {
  width: 1.1rem;
  height: 1.1rem;
}

.preview-card {
  display: grid;
  gap: 0.35rem;
  padding: 1rem;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.preview-card strong {
  font-size: 1.1rem;
}

.preview-card span {
  color: #475569;
}

.settings-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}

.controls {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: end;
}

.search-box {
  width: min(100%, 320px);
  display: grid;
  gap: 0.4rem;
}

.catalog-list {
  display: grid;
  gap: 0.75rem;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.item-main {
  display: flex;
  gap: 1rem;
  align-items: center;
  min-width: 0;
}

.thumb {
  width: 88px;
  height: 88px;
  flex-shrink: 0;
  border-radius: 14px;
  overflow: hidden;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #64748b;
  font-size: 0.8rem;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-copy {
  min-width: 0;
}

.meta-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.35rem;
}

.type-chip,
.stock-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.type-chip {
  background: #e0f2fe;
  color: #075985;
}

.stock-chip {
  background: #fee2e2;
  color: #991b1b;
}

h2 {
  font-size: 1rem;
  margin-bottom: 0.2rem;
}

.price {
  color: #be123c;
  font-weight: 700;
  margin-bottom: 0.2rem;
}

.slug {
  color: #64748b;
  font-size: 0.85rem;
  overflow-wrap: anywhere;
}

.toggle-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  flex-shrink: 0;
  color: #0f172a;
  font-weight: 600;
}

.toggle-wrap input {
  width: 1.1rem;
  height: 1.1rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

@media (max-width: 760px) {
  .page-header,
  .controls,
  .item-row,
  .settings-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }

  .toggle-wrap {
    justify-content: space-between;
  }
}
</style>
