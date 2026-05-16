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
  <section class="checkout-page">
    <header class="page-head">
      <span class="eyebrow">Checkout</span>
      <h1>Selesaikan pesanan Anda</h1>
      <p>Lengkapi informasi pengiriman, pilih layanan kurir, lalu konfirmasi pembayaran.</p>
    </header>

    <div class="steps">
      <span :class="{ active: step === 1, done: step > 1 }">1. Pengiriman</span>
      <span :class="{ active: step === 2, done: step > 2 }">2. Kurir</span>
      <span :class="{ active: step === 3 }">3. Konfirmasi</span>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <form v-if="step === 1" class="panel form" @submit.prevent="goToStep2">
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

    <div v-if="step === 2" class="panel form">
      <div v-if="!shippingOptions.length" class="empty">Tidak ada opsi pengiriman tersedia.</div>
      <div v-else>
        <p class="section-label">Pilih Layanan Pengiriman</p>
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
        <button class="btn-outline" type="button" @click="step = 1">Kembali</button>
        <button class="btn" :disabled="!selectedShipping || loadingSummary" type="button" @click="goToStep3">
          {{ loadingSummary ? 'Memuat...' : 'Lihat Ringkasan' }}
        </button>
      </div>
    </div>

    <div v-if="step === 3 && summary" class="panel form">
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
        <button class="btn-outline" type="button" @click="step = 2">Kembali</button>
        <button class="btn" :disabled="submitting" type="button" @click="placeOrder">
          {{ submitting ? 'Memproses...' : 'Buat Pesanan' }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.checkout-page {
  max-width: 760px;
  margin: 0 auto;
  padding-top: 34px;
}

.page-head {
  margin-bottom: 28px;
}

.eyebrow {
  display: inline-block;
  margin-bottom: 10px;
  font-family: var(--sf-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--sf-accent-strong);
}

h1 {
  font-size: clamp(30px, 4vw, 46px);
  font-weight: 500;
  line-height: 1.04;
  letter-spacing: -0.04em;
  margin-bottom: 10px;
}

.page-head p {
  color: var(--sf-ink-soft);
}

.steps {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.steps span {
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px solid var(--sf-line-strong);
  color: var(--sf-ink-muted);
  font-size: 12px;
  font-family: var(--sf-mono);
}

.steps span.active {
  color: var(--sf-accent-strong);
  border-color: var(--sf-accent);
  background: var(--sf-accent-wash);
}

.steps span.done {
  color: #2f6d42;
  border-color: #b9ddc3;
  background: #eef8f0;
}

.error {
  background: #fff4ef;
  border: 1px solid var(--sf-accent-soft);
  color: var(--sf-accent-strong);
  padding: 14px 16px;
  border-radius: 18px;
  margin-bottom: 16px;
}

.panel {
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-line);
  border-radius: 24px;
}

.form {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field label,
.section-label {
  font-size: 12px;
  font-family: var(--sf-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sf-ink-soft);
}

.field input,
.field textarea,
.field select {
  padding: 13px 15px;
  border: 1px solid var(--sf-line-strong);
  border-radius: 18px;
  font-size: 14px;
  background: #fffdf9;
  color: var(--sf-ink);
}

.field textarea {
  resize: vertical;
}

.field input:focus,
.field textarea:focus,
.field select:focus {
  outline: none;
  border-color: var(--sf-ink);
}

.empty {
  color: var(--sf-ink-soft);
  text-align: center;
  padding: 12px;
}

.shipping-opt {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid var(--sf-line-strong);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.shipping-opt + .shipping-opt {
  margin-top: 10px;
}

.shipping-opt.active {
  border-color: var(--sf-accent);
  background: var(--sf-accent-wash);
}

.etd {
  color: var(--sf-ink-muted);
  font-size: 12px;
}

.summary-rows {
  display: grid;
  gap: 10px;
}

.sum-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--sf-ink-soft);
}

.sum-row.total {
  padding-top: 12px;
  border-top: 1px solid var(--sf-line);
  color: var(--sf-ink);
  font-weight: 700;
}

.btn-row {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.btn,
.btn-outline {
  border-radius: 999px;
  padding: 14px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.btn {
  border: 1px solid var(--sf-accent);
  background: var(--sf-accent);
  color: var(--sf-accent-contrast);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: var(--sf-accent-strong);
  border-color: var(--sf-accent-strong);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  border: 1px solid var(--sf-line-strong);
  background: transparent;
  color: var(--sf-ink);
}

.btn-outline:hover {
  border-color: var(--sf-ink);
}

@media (max-width: 640px) {
  .btn-row {
    flex-direction: column;
  }
}
</style>
