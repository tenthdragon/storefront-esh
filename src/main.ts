import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAnalyticsStore } from './stores/analytics'
import { useStorefrontSettingsStore } from './stores/storefrontSettings'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)

  const storefrontSettings = useStorefrontSettingsStore(pinia)
  const analytics = useAnalyticsStore(pinia)

  try {
    await storefrontSettings.fetchSettings()
  } finally {
    analytics.bootstrap(router)
    await router.isReady()
    app.mount('#app')
  }
}

void bootstrap()
