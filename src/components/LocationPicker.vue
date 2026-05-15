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
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d1d1;
  border-radius: 6px;
  font-size: 0.9rem;
}

.searching {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: #888;
}

.results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #d1d1d1;
  border-top: none;
  border-radius: 0 0 6px 6px;
  list-style: none;
  max-height: 200px;
  overflow-y: auto;
  z-index: 200;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.results li {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.results li:hover {
  background: #f5f5f5;
}

.sub {
  color: #888;
  font-size: 0.8rem;
}

.postal {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.postal label {
  font-size: 0.85rem;
  font-weight: 500;
}
</style>
