<script setup lang="ts">
import { ref, watch } from 'vue'
import { searchLocations, getPostalCodes } from '@/api/checkout'
import type { Location } from '@/types'

const emit = defineEmits<{
  select: [location: Location, postalCode: string]
}>()

const searchQuery = ref('')
const results = ref<Location[]>([])
const selectedLocation = ref<Location | null>(null)
const postalCodes = ref<string[]>([])
const selectedPostalCode = ref('')
const searching = ref(false)
let searchTimer: ReturnType<typeof setTimeout>

watch(searchQuery, (val) => {
  clearTimeout(searchTimer)
  if (val.length < 3) {
    results.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    searching.value = true
    try {
      results.value = await searchLocations(val)
    } finally {
      searching.value = false
    }
  }, 400)
})

async function selectLocation(loc: Location) {
  selectedLocation.value = loc
  results.value = []
  searchQuery.value = loc.name
  postalCodes.value = await getPostalCodes(loc.id)
  selectedPostalCode.value = postalCodes.value[0] ?? ''
  if (selectedPostalCode.value) {
    emit('select', loc, selectedPostalCode.value)
  }
}

function onPostalChange() {
  if (selectedLocation.value && selectedPostalCode.value) {
    emit('select', selectedLocation.value, selectedPostalCode.value)
  }
}
</script>

<template>
  <div class="location-picker">
    <div class="search-wrap">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Cari kecamatan / kota..."
        class="input"
      />
      <span v-if="searching" class="searching">Mencari...</span>
    </div>
    <ul v-if="results.length" class="results">
      <li v-for="loc in results" :key="loc.id" @click="selectLocation(loc)">
        {{ loc.name }}
        <span v-if="loc.city" class="sub">, {{ loc.city }}, {{ loc.province }}</span>
      </li>
    </ul>
    <div v-if="postalCodes.length" class="postal">
      <label>Kode Pos</label>
      <select v-model="selectedPostalCode" @change="onPostalChange" class="input">
        <option v-for="code in postalCodes" :key="code" :value="code">{{ code }}</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.location-picker {
  position: relative;
}

.search-wrap {
  position: relative;
}

.input {
  width: 100%;
  padding: 13px 15px;
  border: 1px solid var(--sf-line-strong);
  border-radius: 18px;
  font-size: 16px;
  background: #fffdf9;
  color: var(--sf-ink);
}

.input:focus {
  outline: none;
  border-color: var(--sf-ink);
}

.searching {
  position: absolute;
  right: 0.95rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: var(--sf-ink-muted);
  font-family: var(--sf-mono);
}

.results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-line-strong);
  border-radius: 18px;
  list-style: none;
  max-height: 200px;
  overflow-y: auto;
  z-index: 200;
  box-shadow: 0 18px 40px rgba(31, 27, 22, 0.08);
  margin-top: 8px;
}

.results li {
  padding: 0.75rem 0.95rem;
  cursor: pointer;
  font-size: 14px;
}

.results li:hover {
  background: var(--sf-accent-wash);
}

.sub {
  color: var(--sf-ink-muted);
  font-size: 12px;
}

.postal {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.postal label {
  font-size: 12px;
  font-family: var(--sf-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sf-ink-soft);
}
</style>
