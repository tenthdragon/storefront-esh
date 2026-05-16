<script setup lang="ts">
import NavBar from '@/components/NavBar.vue'
import { useStorefrontSettingsStore } from '@/stores/storefrontSettings'
import { computed } from 'vue'

const storefrontSettings = useStorefrontSettingsStore()
const appTheme = computed(() => storefrontSettings.themeVars)
</script>

<template>
  <div class="app-shell" :style="appTheme">
    <NavBar />
    <main class="container">
      <RouterView />
    </main>
  </div>
</template>

<style>
@import url('https://fonts.bunny.net/css?family=geist:300,400,500,600,700|jetbrains-mono:400,500');

:root {
  --sf-bg: #ffffff;
  --sf-bg-card: #faf7f2;
  --sf-ink: #1f1b16;
  --sf-ink-soft: #6b6259;
  --sf-ink-muted: #a39989;
  --sf-line: #ebe4d8;
  --sf-line-strong: #d9cfbe;
  --sf-price-bg: #1f1b16;
  --sf-price-ink: #faf7f2;
  --sf-accent: #b85c38;
  --sf-accent-strong: #8a3f24;
  --sf-accent-soft: #e8d5c4;
  --sf-accent-wash: rgba(184, 92, 56, 0.12);
  --sf-accent-contrast: #faf7f2;
  --sf-sans: 'Geist', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  --sf-mono: 'JetBrains Mono', ui-monospace, monospace;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--sf-sans);
  color: var(--sf-ink);
  background: var(--sf-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body,
button,
input,
textarea,
select {
  font-family: var(--sf-sans);
}

a {
  color: inherit;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 32px 96px;
}

.app-shell {
  min-height: 100vh;
}

@media (max-width: 768px) {
  .container {
    padding: 0 24px 72px;
  }
}
</style>
