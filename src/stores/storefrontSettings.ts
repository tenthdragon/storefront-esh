import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getPublicStorefrontSettings } from '@/api/storefront-settings'
import type { StorefrontPublicSettings } from '@/types'

const DEFAULT_BUTTON_COLOR = '#b85c38'

function createDefaultSettings(): StorefrontPublicSettings {
  return {
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
      buttonColor: DEFAULT_BUTTON_COLOR,
    },
  }
}

const DEFAULT_SETTINGS = createDefaultSettings()

function normalizeHexColor(value: string, fallback = DEFAULT_BUTTON_COLOR) {
  const trimmed = value.trim()
  const match = trimmed.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  if (!match) {
    return fallback
  }

  const hex = match[1]
  if (hex.length === 3) {
    return `#${hex.split('').map((char) => char + char).join('').toLowerCase()}`
  }

  return `#${hex.toLowerCase()}`
}

function hexToRgb(hex: string) {
  const normalized = normalizeHexColor(hex)
  const value = normalized.slice(1)
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  }
}

function rgbToHex(rgb: { r: number; g: number; b: number }) {
  return `#${[rgb.r, rgb.g, rgb.b]
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0'))
    .join('')}`
}

function mixColors(baseHex: string, targetHex: string, weight: number) {
  const base = hexToRgb(baseHex)
  const target = hexToRgb(targetHex)
  return rgbToHex({
    r: base.r * (1 - weight) + target.r * weight,
    g: base.g * (1 - weight) + target.g * weight,
    b: base.b * (1 - weight) + target.b * weight,
  })
}

function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getContrastColor(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 155 ? '#1f1b16' : '#faf7f2'
}

export const useStorefrontSettingsStore = defineStore('storefront-settings', () => {
  const settings = ref<StorefrontPublicSettings>(createDefaultSettings())
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)
  let pendingRequest: Promise<void> | null = null

  const storeName = computed(() => settings.value.branding.storeName || 'Toko')
  const heroTitle = computed(() => settings.value.hero.title || DEFAULT_SETTINGS.hero.title)
  const heroSubtitle = computed(() => settings.value.hero.subtitle || DEFAULT_SETTINGS.hero.subtitle)
  const catalogHeadingVisible = computed(() => settings.value.sections.catalog.visible)
  const catalogHeadingTitle = computed(() => settings.value.sections.catalog.title || DEFAULT_SETTINGS.sections.catalog.title)
  const buttonColor = computed(() => normalizeHexColor(settings.value.theme.buttonColor, DEFAULT_BUTTON_COLOR))
  const accentStrong = computed(() => mixColors(buttonColor.value, '#1f1b16', 0.22))
  const accentSoft = computed(() => mixColors(buttonColor.value, '#faf7f2', 0.76))
  const accentWash = computed(() => withAlpha(buttonColor.value, 0.12))
  const accentContrast = computed(() => getContrastColor(buttonColor.value))
  const themeVars = computed<Record<string, string>>(() => ({
    '--sf-accent': buttonColor.value,
    '--sf-accent-strong': accentStrong.value,
    '--sf-accent-soft': accentSoft.value,
    '--sf-accent-wash': accentWash.value,
    '--sf-accent-contrast': accentContrast.value,
  }))

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
    heroTitle,
    heroSubtitle,
    catalogHeadingVisible,
    catalogHeadingTitle,
    buttonColor,
    themeVars,
    fetchSettings,
  }
})
