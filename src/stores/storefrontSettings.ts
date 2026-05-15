import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getPublicStorefrontSettings } from '@/api/storefront-settings'
import type { StorefrontPublicSettings } from '@/types'

function createDefaultSettings(): StorefrontPublicSettings {
  return {
    branding: {
      storeName: '',
    },
    sections: {
      catalog: {
        visible: true,
        title: 'Katalog Produk',
      },
    },
  }
}

export const useStorefrontSettingsStore = defineStore('storefront-settings', () => {
  const settings = ref<StorefrontPublicSettings>(createDefaultSettings())
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)
  let pendingRequest: Promise<void> | null = null

  const storeName = computed(() => settings.value.branding.storeName || 'Toko')
  const catalogHeadingVisible = computed(() => settings.value.sections.catalog.visible)
  const catalogHeadingTitle = computed(() => settings.value.sections.catalog.title || 'Katalog Produk')

  async function fetchSettings() {
    if (loaded.value) return
    if (pendingRequest) return pendingRequest

    pendingRequest = (async () => {
      loading.value = true
      error.value = null
      try {
        settings.value = await getPublicStorefrontSettings()
        loaded.value = true
      } catch (e) {
        error.value = (e as Error).message
      } finally {
        loading.value = false
        pendingRequest = null
      }
    })()

    return pendingRequest
  }

  return {
    settings,
    loading,
    loaded,
    error,
    storeName,
    catalogHeadingVisible,
    catalogHeadingTitle,
    fetchSettings,
  }
})
