<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAnalyticsStore } from '@/stores/analytics'
import { getShippingOptions, getCheckoutSummary, getPaymentMethods, submitCheckout } from '@/api/checkout'
import LocationPicker from '@/components/LocationPicker.vue'
import { useStorefrontSettingsStore } from '@/stores/storefrontSettings'
import type { CartItem, Location, PaymentMethodOption, ShippingOption, Summary } from '@/types'

type CheckoutStep = 'customer' | 'shipping' | 'confirm'

const router = useRouter()
const cart = useCartStore()
const analytics = useAnalyticsStore()
const storefrontSettings = useStorefrontSettingsStore()

onMounted(async () => {
  await cart.fetchCart()
  await storefrontSettings.fetchSettings()
  await loadPaymentMethods()
  if (cart.cart?.items.length) {
    void analytics.trackMetaInitiateCheckout(cart.cart.items, cart.subtotal)
  }
})

const currentStep = ref<CheckoutStep>('customer')
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
const loadingPaymentMethods = ref(false)
const availablePaymentMethods = ref<PaymentMethodOption[]>([])

const cartItems = computed(() => cart.cart?.items ?? [])
const needsShipping = computed(() =>
  cartItems.value.some((item) => item.item_type === 'physical'),
)
const checkoutIntro = computed(() =>
  needsShipping.value
    ? 'Lengkapi informasi pengiriman, pilih layanan kurir, lalu konfirmasi pembayaran.'
    : 'Lengkapi data pelanggan untuk pengiriman produk digital. Untuk checkout digital, kami hanya membutuhkan nama, no. HP, dan email.',
)
const checkoutSteps = computed(() =>
  needsShipping.value
    ? [
        { key: 'customer' as const, label: '1. Pengiriman' },
        { key: 'shipping' as const, label: '2. Kurir' },
        { key: 'confirm' as const, label: '3. Konfirmasi' },
      ]
    : [
        { key: 'customer' as const, label: '1. Pelanggan' },
        { key: 'confirm' as const, label: '2. Konfirmasi' },
      ],
)
const currentStepIndex = computed(() =>
  checkoutSteps.value.findIndex((step) => step.key === currentStep.value),
)
const customerSubmitLabel = computed(() => {
  if (needsShipping.value) {
    return loadingShipping.value ? 'Memuat...' : 'Pilih Kurir'
  }

  return 'Lanjutkan'
})
const allowedPaymentMethodCodes = computed(() => storefrontSettings.settings.checkout.allowedPaymentMethods)
const paymentMethods = computed(() => {
  const enabledMethods = availablePaymentMethods.value.filter((method) => method.enabled)
  const allowedCodes = allowedPaymentMethodCodes.value
  if (!allowedCodes.length) {
    return enabledMethods
  }

  const allowedSet = new Set(allowedCodes)
  return enabledMethods.filter((method) => allowedSet.has(method.code))
})
const customerPhoneInput = computed({
  get: () => formatPhoneForDisplay(form.value.customer_phone),
  set: (value: string) => {
    form.value.customer_phone = normalizePhoneDigits(value)
  },
})

function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, '').slice(0, 15)
}

function formatPhoneForDisplay(value: string) {
  const digits = normalizePhoneDigits(value)
  return digits.match(/.{1,4}/g)?.join(' ') ?? digits
}

function onLocationSelect(loc: Location, postalCode: string) {
  selectedLocation.value = loc
  selectedPostalCode.value = postalCode
}

async function loadPaymentMethods() {
  loadingPaymentMethods.value = true

  try {
    availablePaymentMethods.value = await getPaymentMethods()
    if (!paymentMethods.value.some((method) => method.code === form.value.payment_method)) {
      form.value.payment_method = paymentMethods.value[0]?.code ?? ''
    }
  } catch (e) {
    error.value = (e as Error).message
    availablePaymentMethods.value = []
    form.value.payment_method = ''
  } finally {
    loadingPaymentMethods.value = false
  }
}

function paymentMethodLabel(method: PaymentMethodOption) {
  return method.label || method.code
}

function buildDigitalSummary(): Summary {
  return {
    product_price: cart.subtotal,
    product_discount: 0,
    shipping_cost: 0,
    shipping_discount: 0,
    gross_revenue: cart.subtotal,
  }
}

async function continueFromCustomerStep() {
  error.value = null
  form.value.customer_phone = normalizePhoneDigits(form.value.customer_phone)

  if (!needsShipping.value) {
    summary.value = buildDigitalSummary()
    currentStep.value = 'confirm'
    return
  }

  if (!selectedLocation.value || !selectedPostalCode.value) {
    error.value = 'Pilih lokasi pengiriman terlebih dahulu.'
    return
  }

  loadingShipping.value = true
  try {
    shippingOptions.value = await getShippingOptions({
      shipping_location_id: selectedLocation.value.id,
      shipping_postal_code: selectedPostalCode.value,
    })
    if (shippingOptions.value.length) {
      selectedShipping.value = shippingOptions.value[0]
    }
    currentStep.value = 'shipping'
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loadingShipping.value = false
  }
}

async function goToConfirmationStep() {
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
    currentStep.value = 'confirm'
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loadingSummary.value = false
  }
}

async function placeOrder() {
  if (needsShipping.value && (!selectedLocation.value || !selectedShipping.value)) return
  if (!form.value.payment_method) {
    error.value = 'Belum ada metode pembayaran yang tersedia untuk checkout ini.'
    return
  }

  error.value = null
  submitting.value = true
  try {
    const cartItemsSnapshot = cart.cart?.items ? JSON.parse(JSON.stringify(cart.cart.items)) as CartItem[] : []
    const payload = {
      customer_name: form.value.customer_name,
      customer_email: form.value.customer_email,
      customer_phone: normalizePhoneDigits(form.value.customer_phone),
      payment_method: form.value.payment_method,
      ...(needsShipping.value && selectedLocation.value && selectedShipping.value
        ? {
            shipping_address: form.value.shipping_address,
            shipping_province: selectedLocation.value.province ?? '',
            shipping_city: selectedLocation.value.city ?? '',
            shipping_subdistrict: selectedLocation.value.name,
            shipping_postal_code: selectedPostalCode.value,
            shipping_location_id: selectedLocation.value.id,
            shipping_courier: selectedShipping.value.courier,
            shipping_service: selectedShipping.value.service,
          }
        : {}),
    }

    const order = await submitCheckout(payload)
    void analytics.registerCheckoutPurchase(order, cartItemsSnapshot, {
      name: form.value.customer_name,
      email: form.value.customer_email,
      phone: form.value.customer_phone,
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

function goBack() {
  if (currentStep.value === 'shipping') {
    currentStep.value = 'customer'
    return
  }

  if (currentStep.value === 'confirm') {
    currentStep.value = needsShipping.value ? 'shipping' : 'customer'
  }
}
</script>

<template>
  <section class="checkout-page">
    <header class="page-head">
      <span class="eyebrow">Checkout</span>
      <h1>Selesaikan pesanan Anda</h1>
      <p>{{ checkoutIntro }}</p>
    </header>

    <div class="steps">
      <span
        v-for="(step, index) in checkoutSteps"
        :key="step.key"
        :class="{ active: step.key === currentStep, done: index < currentStepIndex }"
      >
        {{ step.label }}
      </span>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <form v-if="currentStep === 'customer'" class="panel form" @submit.prevent="continueFromCustomerStep">
      <div class="field">
        <label>Nama Lengkap</label>
        <input v-model="form.customer_name" autocomplete="name" required />
      </div>
      <div class="field">
        <label>Email</label>
        <input v-model="form.customer_email" type="email" autocomplete="email" required />
      </div>
      <div class="field">
        <label>No. HP (format: 628xxx)</label>
        <input
          v-model="customerPhoneInput"
          type="tel"
          inputmode="numeric"
          pattern="[0-9 ]*"
          autocomplete="tel"
          placeholder="0877 8127 9345"
          required
        />
      </div>
      <div v-if="needsShipping" class="field">
        <label>Alamat Lengkap</label>
        <textarea v-model="form.shipping_address" rows="3" autocomplete="street-address" required />
      </div>
      <div v-if="needsShipping" class="field">
        <label>Kecamatan / Kota</label>
        <LocationPicker @select="onLocationSelect" />
      </div>
      <button type="submit" class="btn" :disabled="loadingShipping">
        {{ customerSubmitLabel }}
      </button>
    </form>

    <div v-if="currentStep === 'shipping' && needsShipping" class="panel form">
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
        <button class="btn-outline" type="button" @click="goBack">Kembali</button>
        <button class="btn" :disabled="!selectedShipping || loadingSummary" type="button" @click="goToConfirmationStep">
          {{ loadingSummary ? 'Memuat...' : 'Lihat Ringkasan' }}
        </button>
      </div>
    </div>

    <div v-if="currentStep === 'confirm' && summary" class="panel form">
      <p class="section-label">Ringkasan Pesanan</p>
      <div class="summary-rows">
        <div class="sum-row">
          <span>Produk</span>
          <span>{{ formatPrice(summary.product_price - summary.product_discount) }}</span>
        </div>
        <div v-if="needsShipping" class="sum-row">
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
        <select v-model="form.payment_method" :disabled="loadingPaymentMethods || !paymentMethods.length">
          <option v-if="loadingPaymentMethods" value="">Memuat metode pembayaran...</option>
          <option v-else-if="!paymentMethods.length" value="">Tidak ada metode pembayaran tersedia</option>
          <option v-for="method in paymentMethods" :key="method.code" :value="method.code">
            {{ paymentMethodLabel(method) }}
          </option>
        </select>
      </div>
      <div class="btn-row">
        <button class="btn-outline" type="button" @click="goBack">Kembali</button>
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
  font-size: 16px;
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
