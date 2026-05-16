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
  updateStorefrontSettings,
} from '@/api/admin'
import type { Item, MetaPurchaseTrigger, StorefrontSettings } from '@/types'

type AdminSection = 'presentation' | 'catalog' | 'ads'

const DEFAULT_SETTINGS: StorefrontSettings = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  items: {},
  branding: {
    storeName: '',
  },
  hero: {
    title: 'Koleksi digital pilihan untuk belajar, bertumbuh, dan membangun langkah berikutnya dengan lebih jelas.',
    subtitle: 'Materi yang dipilih satu per satu untuk membantu Anda bergerak lebih tenang, lebih paham, dan lebih siap menghadapi era baru.',
  },
  sections: {
    catalog: {
      visible: true,
      title: 'Katalog Produk',
    },
  },
  theme: {
    buttonColor: '#b85c38',
    priceLabelColor: '#1f1b16',
  },
  analytics: {
    meta: {
      enabled: false,
      pixelId: '',
      trackViewContent: true,
      trackAddToCart: true,
      trackInitiateCheckout: true,
      trackPurchase: true,
      purchaseTrigger: 'checkout_success',
    },
  },
}

const settings = ref<StorefrontSettings>(DEFAULT_SETTINGS)
const items = ref<Item[]>([])
const count = ref(0)
const page = ref(1)
const search = ref('')
const loadingCatalog = ref(false)
const loadingSettings = ref(false)
const settingsLoaded = ref(false)
const checkingSession = ref(true)
const loggingIn = ref(false)
const authenticated = ref(false)
const configured = ref(true)
const authError = ref<string | null>(null)
const catalogError = ref<string | null>(null)
const settingsError = ref<string | null>(null)
const password = ref('')
const savingKey = ref<string | null>(null)
const activeSection = ref<AdminSection>('presentation')

const presentationSaving = ref(false)
const presentationError = ref<string | null>(null)
const presentationSaved = ref<string | null>(null)
const storeNameInput = ref('')
const heroTitleInput = ref('')
const heroSubtitleInput = ref('')
const showCatalogHeading = ref(true)
const catalogHeadingInput = ref('Katalog Produk')
const buttonColorInput = ref('#b85c38')
const priceLabelColorInput = ref('#1f1b16')

const adsSaving = ref(false)
const adsError = ref<string | null>(null)
const adsSaved = ref<string | null>(null)
const metaEnabled = ref(false)
const metaPixelIdInput = ref('')
const metaTrackViewContent = ref(true)
const metaTrackAddToCart = ref(true)
const metaTrackInitiateCheckout = ref(true)
const metaTrackPurchase = ref(true)
const metaPurchaseTrigger = ref<MetaPurchaseTrigger>('checkout_success')

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

function normalizeHexColor(value: string, fallback: string) {
  const trimmed = value.trim()
  const match = trimmed.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  if (!match) return fallback

  const hex = match[1]
  if (hex.length === 3) {
    return `#${hex.split('').map((char) => char + char).join('').toLowerCase()}`
  }

  return `#${hex.toLowerCase()}`
}

function getContrastPreviewColor(hex: string) {
  const normalized = normalizeHexColor(hex, '#b85c38').slice(1)
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 155 ? '#1f1b16' : '#faf7f2'
}

const totalPages = computed(() => Math.max(1, Math.ceil(count.value / PER_PAGE)))
const visibleCountOnPage = computed(() => items.value.filter((item) => isVisible(item)).length)
const hiddenItemsCount = computed(() => Object.keys(settings.value.items).length)
const previewButtonColor = computed(() => normalizeHexColor(buttonColorInput.value, '#b85c38'))
const previewPriceLabelColor = computed(() => normalizeHexColor(priceLabelColorInput.value, '#1f1b16'))
const previewButtonInk = computed(() => getContrastPreviewColor(previewButtonColor.value))
const enabledMetaEvents = computed(() => {
  let total = 0
  if (metaTrackViewContent.value) total += 1
  if (metaTrackAddToCart.value) total += 1
  if (metaTrackInitiateCheckout.value) total += 1
  if (metaTrackPurchase.value) total += 1
  return total
})
const metaPurchaseTriggerLabel = computed(() =>
  metaPurchaseTrigger.value === 'checkout_success'
    ? 'Saat checkout berhasil'
    : 'Saat order berstatus lunas',
)

function syncPresentationForm() {
  storeNameInput.value = settings.value.branding.storeName
  heroTitleInput.value = settings.value.hero.title
  heroSubtitleInput.value = settings.value.hero.subtitle
  showCatalogHeading.value = settings.value.sections.catalog.visible
  catalogHeadingInput.value = settings.value.sections.catalog.title
  buttonColorInput.value = settings.value.theme.buttonColor
  priceLabelColorInput.value = settings.value.theme.priceLabelColor
}

function syncAdsForm() {
  metaEnabled.value = settings.value.analytics.meta.enabled
  metaPixelIdInput.value = settings.value.analytics.meta.pixelId
  metaTrackViewContent.value = settings.value.analytics.meta.trackViewContent
  metaTrackAddToCart.value = settings.value.analytics.meta.trackAddToCart
  metaTrackInitiateCheckout.value = settings.value.analytics.meta.trackInitiateCheckout
  metaTrackPurchase.value = settings.value.analytics.meta.trackPurchase
  metaPurchaseTrigger.value = settings.value.analytics.meta.purchaseTrigger
}

async function loadSession() {
  authError.value = null
  try {
    const session = await getAdminSession()
    authenticated.value = session.authenticated
    configured.value = session.configured
  } catch (error) {
    configured.value = false
    authError.value = (error as Error).message
  } finally {
    checkingSession.value = false
  }
}

async function loadSettings() {
  if (!authenticated.value) return

  loadingSettings.value = true
  settingsError.value = null

  try {
    settings.value = await getStorefrontSettings()
    syncPresentationForm()
    syncAdsForm()
    settingsLoaded.value = true
  } catch (error) {
    settingsError.value = (error as Error).message
  } finally {
    loadingSettings.value = false
  }
}

async function loadCatalog() {
  if (!authenticated.value) return

  loadingCatalog.value = true
  catalogError.value = null

  try {
    const [itemsData, countData] = await Promise.all([
      getAdminItems({ page: page.value, per_page: PER_PAGE, search: search.value || undefined }),
      getAdminItemCount(search.value || undefined),
    ])

    items.value = itemsData.data
    count.value = countData.total
  } catch (error) {
    catalogError.value = (error as Error).message
  } finally {
    loadingCatalog.value = false
  }
}

async function refreshAdminData() {
  await Promise.all([
    loadSettings(),
    loadCatalog(),
  ])
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
    await refreshAdminData()
  } catch (error) {
    authError.value = (error as Error).message
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
  adsSaved.value = null
  adsError.value = null
}

async function updateVisibility(item: Item, visible: boolean) {
  const key = itemKey(item)
  savingKey.value = key
  catalogError.value = null

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
  } catch (error) {
    settings.value = previousSettings
    catalogError.value = (error as Error).message
  } finally {
    savingKey.value = null
  }
}

async function savePresentation() {
  presentationSaving.value = true
  presentationError.value = null
  presentationSaved.value = null

  try {
    settings.value = await updateStorefrontSettings({
      branding: {
        storeName: storeNameInput.value,
      },
      hero: {
        title: heroTitleInput.value,
        subtitle: heroSubtitleInput.value,
      },
      sections: {
        catalog: {
          visible: showCatalogHeading.value,
          title: catalogHeadingInput.value,
        },
      },
      theme: {
        buttonColor: buttonColorInput.value,
        priceLabelColor: priceLabelColorInput.value,
      },
    })
    syncPresentationForm()
    syncAdsForm()
    presentationSaved.value = 'Presentasi storefront berhasil disimpan.'
  } catch (error) {
    presentationError.value = (error as Error).message
  } finally {
    presentationSaving.value = false
  }
}

async function saveAdsSettings() {
  adsSaving.value = true
  adsError.value = null
  adsSaved.value = null

  try {
    settings.value = await updateStorefrontSettings({
      analytics: {
        meta: {
          enabled: metaEnabled.value,
          pixelId: metaPixelIdInput.value,
          trackViewContent: metaTrackViewContent.value,
          trackAddToCart: metaTrackAddToCart.value,
          trackInitiateCheckout: metaTrackInitiateCheckout.value,
          trackPurchase: metaTrackPurchase.value,
          purchaseTrigger: metaPurchaseTrigger.value,
        },
      },
    })
    syncAdsForm()
    adsSaved.value = 'Pengaturan Meta Ads berhasil disimpan.'
  } catch (error) {
    adsError.value = (error as Error).message
  } finally {
    adsSaving.value = false
  }
}

onMounted(async () => {
  await loadSession()
  if (authenticated.value) {
    await refreshAdminData()
  }
})

watch(page, () => {
  if (authenticated.value) {
    void loadCatalog()
  }
})

watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    void loadCatalog()
  }, 300)
})

watch(
  [
    storeNameInput,
    heroTitleInput,
    heroSubtitleInput,
    showCatalogHeading,
    catalogHeadingInput,
    buttonColorInput,
    priceLabelColorInput,
  ],
  () => {
    presentationSaved.value = null
  },
)

watch(
  [
    metaEnabled,
    metaPixelIdInput,
    metaTrackViewContent,
    metaTrackAddToCart,
    metaTrackInitiateCheckout,
    metaTrackPurchase,
    metaPurchaseTrigger,
  ],
  () => {
    adsSaved.value = null
  },
)
</script>

<template>
  <section class="admin-shell">
    <header class="page-header">
      <div>
        <p class="eyebrow">Owner Settings</p>
        <h1>Control Center Storefront</h1>
        <p class="subcopy">
          Semua pengaturan storefront dikumpulkan di sini: presentasi, kurasi katalog, dan event tracking Meta Ads.
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
        <p class="subcopy">
          Halaman ini hanya untuk mengatur apa yang tampil di storefront dan bagaimana event ads dikirim.
        </p>

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
      <section class="overview-grid">
        <article class="panel stat-card">
          <span class="stat-label">Brand</span>
          <strong>{{ storeNameInput.trim() || 'Toko' }}</strong>
          <p>{{ showCatalogHeading ? catalogHeadingInput.trim() || 'Katalog Produk' : 'Judul katalog disembunyikan' }}</p>
        </article>

        <article class="panel stat-card">
          <span class="stat-label">Kurasi katalog</span>
          <strong>{{ hiddenItemsCount }} item disembunyikan</strong>
          <p>{{ count }} item tersedia untuk dikelola.</p>
        </article>

        <article class="panel stat-card">
          <span class="stat-label">Meta Ads</span>
          <strong>{{ metaEnabled ? 'Aktif' : 'Belum aktif' }}</strong>
          <p>{{ metaEnabled ? `${enabledMetaEvents} event aktif • ${metaPurchaseTriggerLabel}` : 'Pixel dan relay event belum dinyalakan.' }}</p>
        </article>
      </section>

      <nav class="section-nav" aria-label="Admin sections">
        <button
          type="button"
          :class="['section-tab', { active: activeSection === 'presentation' }]"
          @click="activeSection = 'presentation'"
        >
          Presentasi
        </button>
        <button
          type="button"
          :class="['section-tab', { active: activeSection === 'catalog' }]"
          @click="activeSection = 'catalog'"
        >
          Katalog
        </button>
        <button
          type="button"
          :class="['section-tab', { active: activeSection === 'ads' }]"
          @click="activeSection = 'ads'"
        >
          Ads Tracking
        </button>
      </nav>

      <div v-if="settingsError && activeSection !== 'catalog'" class="panel error-panel">
        <strong>Error:</strong> {{ settingsError }}
      </div>

      <div v-if="catalogError && activeSection === 'catalog'" class="panel error-panel">
        <strong>Error:</strong> {{ catalogError }}
      </div>

      <form
        v-if="activeSection === 'presentation'"
        class="panel section-panel"
        @submit.prevent="savePresentation"
      >
        <div class="section-copy">
          <p class="eyebrow">Presentasi</p>
          <h2>Branding, hero, dan label storefront</h2>
          <p class="subcopy">
            Atur nama toko, area hero, judul section katalog, dan warna-warna utama tanpa mengubah kode UI.
          </p>
        </div>

        <div v-if="loadingSettings && !settingsLoaded" class="inner-loading">Memuat pengaturan storefront...</div>

        <div v-else class="split-layout">
          <div class="form-grid">
            <label class="field">
              <span>Nama toko</span>
              <input
                v-model="storeNameInput"
                type="text"
                placeholder="Misalnya: Army Alghifari"
              />
            </label>

            <label class="field field-wide">
              <span>Hero title</span>
              <textarea
                v-model="heroTitleInput"
                rows="4"
                placeholder="Tulis judul hero utama storefront"
              />
            </label>

            <label class="field field-wide">
              <span>Hero subtitle</span>
              <textarea
                v-model="heroSubtitleInput"
                rows="3"
                placeholder="Tulis penjelasan singkat di bawah hero"
              />
            </label>

            <label class="field checkbox-inline">
              <span>Tampilkan judul section katalog</span>
              <input v-model="showCatalogHeading" type="checkbox" />
            </label>

            <label class="field">
              <span>Nama section katalog</span>
              <input
                v-model="catalogHeadingInput"
                type="text"
                :disabled="!showCatalogHeading"
                placeholder="Misalnya: Katalog Produk"
              />
            </label>

            <label class="field">
              <span>Warna tombol utama</span>
              <div class="color-field">
                <input v-model="buttonColorInput" type="color" class="color-picker" />
                <input
                  v-model="buttonColorInput"
                  type="text"
                  class="color-input"
                  placeholder="#B85C38"
                />
              </div>
            </label>

            <label class="field">
              <span>Warna tulisan harga</span>
              <div class="color-field">
                <input v-model="priceLabelColorInput" type="color" class="color-picker" />
                <input
                  v-model="priceLabelColorInput"
                  type="text"
                  class="color-input"
                  placeholder="#1F1B16"
                />
              </div>
            </label>
          </div>

          <aside class="preview-card">
            <p class="stat-label">Preview singkat</p>
            <strong>{{ storeNameInput.trim() || 'Toko' }}</strong>
            <h3>{{ heroTitleInput.trim() || settings.hero.title }}</h3>
            <p>{{ heroSubtitleInput.trim() || settings.hero.subtitle }}</p>
            <span>{{ showCatalogHeading ? catalogHeadingInput.trim() || 'Katalog Produk' : 'Judul katalog disembunyikan' }}</span>
            <button
              type="button"
              class="preview-btn"
              :style="{ backgroundColor: previewButtonColor, borderColor: previewButtonColor, color: previewButtonInk }"
            >
              Tombol Preview
            </button>
            <span class="preview-price" :style="{ color: previewPriceLabelColor }">Rp195.000</span>
          </aside>
        </div>

        <div class="form-actions">
          <p v-if="presentationError" class="error-text">{{ presentationError }}</p>
          <p v-else-if="presentationSaved" class="success-text">{{ presentationSaved }}</p>

          <button class="primary-btn" :disabled="presentationSaving">
            {{ presentationSaving ? 'Menyimpan...' : 'Simpan Presentasi' }}
          </button>
        </div>
      </form>

      <section v-else-if="activeSection === 'catalog'" class="catalog-shell">
        <div class="panel catalog-toolbar">
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

        <div v-if="loadingCatalog" class="panel center">Memuat katalog owner...</div>
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
          <button :disabled="page === 1 || loadingCatalog" @click="page--">Sebelumnya</button>
          <span>{{ page }} / {{ totalPages }}</span>
          <button :disabled="page === totalPages || loadingCatalog" @click="page++">Berikutnya</button>
        </div>
      </section>

      <form v-else class="panel section-panel" @submit.prevent="saveAdsSettings">
        <div class="section-copy">
          <p class="eyebrow">Ads Tracking</p>
          <h2>Meta Ads dan conversion relay</h2>
          <p class="subcopy">
            Nyalakan pixel, pilih event yang dikirim ke Scalev relay, dan tentukan kapan event Purchase dianggap terjadi.
          </p>
        </div>

        <div v-if="loadingSettings && !settingsLoaded" class="inner-loading">Memuat pengaturan tracking...</div>

        <div v-else class="split-layout">
          <div class="form-grid">
            <label class="field checkbox-inline checkbox-strong">
              <span>Aktifkan Meta Ads tracking</span>
              <input v-model="metaEnabled" type="checkbox" />
            </label>

            <label class="field field-wide">
              <span>Meta Pixel ID</span>
              <input
                v-model="metaPixelIdInput"
                type="text"
                :disabled="!metaEnabled"
                placeholder="Misalnya: 123456789012345"
              />
            </label>

            <div class="field field-wide note-box">
              <strong>Catatan penting</strong>
              <p>
                Semua setting app-side sudah dipusatkan di sini. Untuk token dan tujuan akhir conversion relay,
                storefront Anda tetap mengikuti konfigurasi analytics yang sudah diatur di Scalev.
              </p>
            </div>

            <div class="field field-wide">
              <span>Event yang dikirim</span>
              <div class="toggle-grid">
                <label class="checkbox-card">
                  <input v-model="metaTrackViewContent" type="checkbox" :disabled="!metaEnabled" />
                  <div>
                    <strong>ViewContent</strong>
                    <p>Dikirim saat halaman detail produk atau bundle tampil.</p>
                  </div>
                </label>

                <label class="checkbox-card">
                  <input v-model="metaTrackAddToCart" type="checkbox" :disabled="!metaEnabled" />
                  <div>
                    <strong>AddToCart</strong>
                    <p>Dikirim setelah item berhasil masuk ke cart.</p>
                  </div>
                </label>

                <label class="checkbox-card">
                  <input v-model="metaTrackInitiateCheckout" type="checkbox" :disabled="!metaEnabled" />
                  <div>
                    <strong>InitiateCheckout</strong>
                    <p>Dikirim saat halaman checkout dibuka dengan item yang valid.</p>
                  </div>
                </label>

                <label class="checkbox-card">
                  <input v-model="metaTrackPurchase" type="checkbox" :disabled="!metaEnabled" />
                  <div>
                    <strong>Purchase</strong>
                    <p>Dikirim hanya dari satu titik yang Anda pilih di bawah.</p>
                  </div>
                </label>
              </div>
            </div>

            <label class="field">
              <span>Pemicu event Purchase</span>
              <select v-model="metaPurchaseTrigger" :disabled="!metaEnabled || !metaTrackPurchase">
                <option value="checkout_success">Saat checkout berhasil dibuat</option>
                <option value="order_paid">Saat halaman order berstatus lunas</option>
              </select>
            </label>
          </div>

          <aside class="preview-card preview-card-dark">
            <p class="stat-label">Ringkasan tracking</p>
            <strong>{{ metaEnabled ? 'Meta Ads aktif' : 'Meta Ads belum aktif' }}</strong>
            <p>{{ metaPixelIdInput.trim() || 'Pixel ID belum diisi.' }}</p>
            <span>{{ enabledMetaEvents }} event aktif</span>
            <span>{{ metaPurchaseTriggerLabel }}</span>
            <div class="status-pills">
              <span :class="['status-pill', { active: metaTrackViewContent && metaEnabled }]">ViewContent</span>
              <span :class="['status-pill', { active: metaTrackAddToCart && metaEnabled }]">AddToCart</span>
              <span :class="['status-pill', { active: metaTrackInitiateCheckout && metaEnabled }]">InitiateCheckout</span>
              <span :class="['status-pill', { active: metaTrackPurchase && metaEnabled }]">Purchase</span>
            </div>
          </aside>
        </div>

        <div class="form-actions">
          <p v-if="adsError" class="error-text">{{ adsError }}</p>
          <p v-else-if="adsSaved" class="success-text">{{ adsSaved }}</p>

          <button class="primary-btn" :disabled="adsSaving">
            {{ adsSaving ? 'Menyimpan...' : 'Simpan Meta Ads' }}
          </button>
        </div>
      </form>
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
  color: var(--sf-ink-muted);
}

.subcopy {
  color: var(--sf-ink-soft);
  max-width: 72ch;
}

.page-header h1,
.panel h2 {
  margin: 0.35rem 0 0.6rem;
  font-size: clamp(1.8rem, 2vw, 2.4rem);
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.panel {
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-line);
  border-radius: 24px;
  padding: 1.25rem;
}

.panel.center {
  text-align: center;
  color: var(--sf-ink-soft);
  padding: 2rem 1.25rem;
}

.warning {
  background: #fff8ef;
}

.error-panel {
  color: #8c3c2b;
  background: #fff4ef;
  border-color: #e7c4b9;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.stat-card {
  display: grid;
  gap: 0.35rem;
}

.stat-card strong {
  font-size: 1.2rem;
  letter-spacing: -0.03em;
}

.stat-card p {
  color: var(--sf-ink-soft);
}

.stat-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--sf-ink-muted);
}

.section-nav {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.section-tab {
  appearance: none;
  border: 1px solid var(--sf-line-strong);
  background: #fff;
  color: var(--sf-ink);
  border-radius: 999px;
  padding: 0.8rem 1rem;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.section-tab:hover {
  transform: translateY(-1px);
}

.section-tab.active {
  border-color: var(--sf-accent);
  background: var(--sf-accent-wash);
  color: var(--sf-accent-strong);
}

.section-panel {
  display: grid;
  gap: 1.2rem;
}

.section-copy {
  display: grid;
  gap: 0.3rem;
}

.split-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.8fr);
  gap: 1rem;
  align-items: start;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.field {
  display: grid;
  gap: 0.5rem;
}

.field span {
  font-weight: 600;
  font-size: 0.95rem;
}

.field input,
.field textarea,
.field select {
  width: 100%;
  border: 1px solid var(--sf-line-strong);
  border-radius: 16px;
  padding: 0.85rem 0.95rem;
  background: #fff;
  color: var(--sf-ink);
  resize: vertical;
}

.field input:focus,
.field textarea:focus,
.field select:focus,
.search-box input:focus {
  outline: none;
  border-color: var(--sf-accent);
  box-shadow: 0 0 0 3px var(--sf-accent-wash);
}

.field-wide {
  grid-column: 1 / -1;
}

.checkbox-inline {
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 1rem;
}

.checkbox-inline input,
.checkbox-card input {
  width: 18px;
  height: 18px;
}

.checkbox-strong {
  padding: 1rem;
  border: 1px solid var(--sf-line-strong);
  border-radius: 18px;
  background: #fff;
}

.color-field {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.75rem;
}

.color-picker {
  width: 52px;
  min-width: 52px;
  padding: 0;
  border-radius: 14px;
  overflow: hidden;
}

.color-input {
  font-family: var(--sf-mono);
}

.preview-card {
  display: grid;
  gap: 0.8rem;
  padding: 1.25rem;
  border-radius: 22px;
  background: #fff;
  border: 1px solid var(--sf-line);
}

.preview-card strong {
  font-size: 1.1rem;
  letter-spacing: -0.02em;
}

.preview-card h3 {
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  line-height: 1.02;
  letter-spacing: -0.05em;
}

.preview-card p,
.preview-card span {
  color: var(--sf-ink-soft);
}

.preview-btn {
  width: fit-content;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 0.8rem 1.1rem;
  font-weight: 600;
}

.preview-price {
  font-family: var(--sf-mono);
  font-size: 1rem;
}

.preview-card-dark {
  background: linear-gradient(180deg, #1f1b16 0%, #2b241d 100%);
  color: #faf7f2;
  border-color: transparent;
}

.preview-card-dark p,
.preview-card-dark span,
.preview-card-dark .stat-label {
  color: rgba(250, 247, 242, 0.72);
}

.status-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.status-pill {
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(250, 247, 242, 0.18);
  color: rgba(250, 247, 242, 0.52);
  font-size: 0.78rem;
}

.status-pill.active {
  border-color: rgba(250, 247, 242, 0.3);
  color: #faf7f2;
  background: rgba(250, 247, 242, 0.08);
}

.note-box {
  padding: 1rem;
  border-radius: 18px;
  border: 1px dashed var(--sf-line-strong);
  background: #fff;
}

.note-box p {
  color: var(--sf-ink-soft);
  line-height: 1.6;
}

.toggle-grid {
  display: grid;
  gap: 0.75rem;
}

.checkbox-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.9rem;
  align-items: start;
  padding: 1rem;
  border-radius: 18px;
  border: 1px solid var(--sf-line-strong);
  background: #fff;
}

.checkbox-card p {
  color: var(--sf-ink-soft);
  margin-top: 0.2rem;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.primary-btn,
.ghost-btn,
.pagination button {
  appearance: none;
  border-radius: 999px;
  padding: 0.85rem 1.15rem;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease, border-color 0.2s ease;
}

.primary-btn {
  border: 1px solid var(--sf-accent);
  background: var(--sf-accent);
  color: var(--sf-accent-contrast);
  font-weight: 600;
}

.ghost-btn {
  border: 1px solid var(--sf-line-strong);
  background: #fff;
  color: var(--sf-ink);
}

.primary-btn:disabled,
.ghost-btn:disabled,
.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-wrap {
  display: grid;
  place-items: center;
}

.login-panel {
  width: min(100%, 420px);
  display: grid;
  gap: 1rem;
}

.catalog-shell {
  display: grid;
  gap: 1rem;
}

.catalog-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.search-box {
  display: grid;
  gap: 0.35rem;
  width: min(100%, 360px);
}

.search-box span {
  font-weight: 600;
  font-size: 0.95rem;
}

.search-box input {
  width: 100%;
  border: 1px solid var(--sf-line-strong);
  border-radius: 16px;
  padding: 0.85rem 0.95rem;
  background: #fff;
}

.catalog-list {
  display: grid;
  gap: 0.85rem;
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
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--sf-line);
  display: grid;
  place-items: center;
  color: var(--sf-ink-muted);
  font-size: 0.82rem;
  text-align: center;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-copy {
  min-width: 0;
  display: grid;
  gap: 0.35rem;
}

.item-copy h2 {
  font-size: 1.1rem;
  letter-spacing: -0.02em;
}

.price {
  font-family: var(--sf-mono);
  font-size: 0.92rem;
}

.slug {
  color: var(--sf-ink-muted);
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}

.meta-row {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.type-chip,
.stock-chip {
  border-radius: 999px;
  padding: 0.35rem 0.65rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.type-chip {
  background: #fff;
  border: 1px solid var(--sf-line-strong);
}

.stock-chip {
  color: #8c3c2b;
  background: #fff4ef;
  border: 1px solid #e7c4b9;
}

.toggle-wrap {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  white-space: nowrap;
}

.toggle-wrap input {
  width: 18px;
  height: 18px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  color: var(--sf-ink-soft);
}

.pagination button {
  border: 1px solid var(--sf-line-strong);
  background: #fff;
  color: var(--sf-ink);
}

.error-text {
  color: #8c3c2b;
}

.success-text {
  color: #2b6b4d;
}

.inner-loading {
  color: var(--sf-ink-soft);
}

@media (max-width: 1024px) {
  .overview-grid,
  .split-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-header,
  .catalog-toolbar,
  .item-row,
  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .search-box,
  .thumb {
    width: 100%;
  }

  .thumb {
    max-width: 88px;
  }

  .toggle-wrap {
    justify-content: space-between;
  }
}
</style>
