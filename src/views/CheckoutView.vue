<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { getShippingOptions, getCheckoutSummary, submitCheckout } from '@/api/checkout'
import LocationPicker from '@/components/LocationPicker.vue'
import type { Location, ShippingOption, Summary } from '@/types'

const router = useRouter()
const cart = useCartStore()

onMounted(() => cart.fetchCart())

const step = ref(1)
const submitting = ref(false)
const error = ref<string | null>(null)

const form = ref({
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  shipping_address: '',
  payment_method: 'bank_transfer',
})

const selectedLocation = ref<Location | null>(null)
const selectedPostalCode = ref('')
const shippingOptions = ref<ShippingOption[]>([])
const selectedShipping = ref<ShippingOption | null>(null)
const summary = ref<Summary | null>(null)
const loadingShipping = ref(false)
const loadingSummary = ref(false)

function onLocationSelect(loc: Location, postalCode: string) {
  selectedLocation.value = loc
  selectedPostalCode.value = postalCode
}

async function goToStep2() {
  if (!selectedLocation.value || !selectedPostalCode.value) {
    error.value = 'Pilih lokasi pengiriman terlebih dahulu.'
    return
  }
  error.value = null
  loadingShipping.value = true
  try {
    shippingOptions.value = await getShippingOptions({
      shipping_location_id: selectedLocation.value.id,
      shipping_postal_code: selectedPostalCode.value,
    })
    if (shippingOptions.value.length) {
      selectedShipping.value = shippingOptions.value[0]
    }
    step.value = 2
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loadingShipping.value = false
  }
}

async function goToStep3() {
  if (!selectedShipping.value || !selectedLocation.value) return
  error.value = null
  loadingSummary.value = true
  try {
    summary.value = await getCheckoutSummary({
      shipping_location_id: selectedLocation.value.id,
      shipping_postal_code: selectedPostalCode.value,
      shipping_courier: selectedShipping.value.courier,
      shipping_service: selectedShipping.value.service,
    })
    step.value = 3
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loadingSummary.value = false
  }
}

async function placeOrder() {
  if (!selectedLocation.value || !selectedShipping.value) return
  error.value = null
  submitting.value = true
  try {
    const order = await submitCheckout({
      customer_name: form.value.customer_name,
      customer_email: form.value.customer_email,
      customer_phone: form.value.customer_phone,
      shipping_address: form.value.shipping_address,
      shipping_province: selectedLocation.value.province ?? '',
      shipping_city: selectedLocation.value.city ?? '',
      shipping_subdistrict: selectedLocation.value.name,
      shipping_postal_code: selectedPostalCode.value,
      shipping_location_id: selectedLocation.value.id,
      shipping_courier: selectedShipping.value.courier,
      shipping_service: selectedShipping.value.service,
      payment_method: form.value.payment_method,
    })
    router.push(`/orders/${order.secret_slug}`)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    submitting.value = false
  }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price)
}
</script>

<template>
  <div class="checkout">
    <h1>Checkout</h1>

    <div class="steps">
      <span :class="{ active: step === 1, done: step > 1 }">1. Info Pengiriman</span>
      <span :class="{ active: step === 2, done: step > 2 }">2. Pilih Kurir</span>
      <span :class="{ active: step === 3 }">3. Konfirmasi</span>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <!-- Step 1: Info pengiriman -->
    <form v-if="step === 1" @submit.prevent="goToStep2" class="form">
      <div class="field">
        <label>Nama Lengkap</label>
        <input v-model="form.customer_name" required />
      </div>
      <div class="field">
        <label>Email</label>
        <input v-model="form.customer_email" type="email" required />
      </div>
      <div class="field">
        <label>No. HP (format: 628xxx)</label>
        <input v-model="form.customer_phone" required />
      </div>
      <div class="field">
        <label>Alamat Lengkap</label>
        <textarea v-model="form.shipping_address" rows="3" required />
      </div>
      <div class="field">
        <label>Kecamatan / Kota</label>
        <LocationPicker @select="onLocationSelect" />
      </div>
      <button type="submit" class="btn" :disabled="loadingShipping">
        {{ loadingShipping ? 'Memuat...' : 'Pilih Kurir' }}
      </button>
    </form>

    <!-- Step 2: Pilih kurir -->
    <div v-if="step === 2" class="form">
      <div v-if="!shippingOptions.length" class="empty">Tidak ada opsi pengiriman tersedia.</div>
      <div v-else>
        <p class="section-label">Pilih Layanan Pengiriman:</p>
        <div
          v-for="opt in shippingOptions"
          :key="`${opt.courier}-${opt.service}`"
          :class="['shipping-opt', { active: selectedShipping?.service === opt.service && selectedShipping?.courier === opt.courier }]"
          @click="selectedShipping = opt"
        >
          <div>
            <strong>{{ opt.courier.toUpperCase() }} - {{ opt.service }}</strong>
            <span v-if="opt.etd" class="etd"> ({{ opt.etd }} hari)</span>
          </div>
          <span>{{ formatPrice(opt.cost) }}</span>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn-outline" @click="step = 1">Kembali</button>
        <button class="btn" :disabled="!selectedShipping || loadingSummary" @click="goToStep3">
          {{ loadingSummary ? 'Memuat...' : 'Lihat Ringkasan' }}
        </button>
      </div>
    </div>

    <!-- Step 3: Konfirmasi -->
    <div v-if="step === 3 && summary" class="form">
      <p class="section-label">Ringkasan Pesanan</p>
      <div class="summary-rows">
        <div class="sum-row">
          <span>Produk</span>
          <span>{{ formatPrice(summary.product_price - summary.product_discount) }}</span>
        </div>
        <div class="sum-row">
          <span>Ongkir ({{ selectedShipping?.courier }} {{ selectedShipping?.service }})</span>
          <span>{{ formatPrice(summary.shipping_cost - summary.shipping_discount) }}</span>
        </div>
        <div class="sum-row total">
          <span>Total</span>
          <span>{{ formatPrice(summary.gross_revenue) }}</span>
        </div>
      </div>
      <div class="field">
        <label>Metode Pembayaran</label>
        <select v-model="form.payment_method">
          <option value="bank_transfer">Transfer Bank</option>
          <option value="cod">Bayar di Tempat (COD)</option>
        </select>
      </div>
      <div class="btn-row">
        <button class="btn-outline" @click="step = 2">Kembali</button>
        <button class="btn" :disabled="submitting" @click="placeOrder">
          {{ submitting ? 'Memproses...' : 'Buat Pesanan' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checkout {
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.steps {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.85rem;
  color: #aaa;
}

.steps span.active {
  color: #e53e3e;
  font-weight: 700;
}

.steps span.done {
  color: #22c55e;
}

.error {
  background: #fff5f5;
  border: 1px solid #e53e3e;
  color: #e53e3e;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.form {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field label {
  font-size: 0.85rem;
  font-weight: 600;
}

.field input,
.field textarea,
.field select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d1d1;
  border-radius: 6px;
  font-size: 0.9rem;
  font-family: inherit;
}

.section-label {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.empty {
  color: #888;
  text-align: center;
  padding: 1rem;
}

.shipping-opt {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d1d1;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.shipping-opt.active {
  border-color: #e53e3e;
  background: #fff5f5;
}

.etd {
  color: #888;
  font-size: 0.8rem;
}

.btn-row {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn {
  flex: 1;
  padding: 0.75rem;
  background: #e53e3e;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  flex: 1;
  padding: 0.75rem;
  background: #fff;
  color: #555;
  border: 1px solid #d1d1d1;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}

.summary-rows {
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  overflow: hidden;
}

.sum-row {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 0.75rem;
  font-size: 0.9rem;
  border-bottom: 1px solid #f0f0f0;
}

.sum-row.total {
  font-weight: 700;
  color: #e53e3e;
  border-bottom: none;
}
</style>
