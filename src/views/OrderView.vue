<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOrder } from '@/api/checkout'
import PaymentInstructions from '@/components/PaymentInstructions.vue'
import { useAnalyticsStore } from '@/stores/analytics'
import type { Order } from '@/types'
import { getOrderCustomerName } from '@/utils/order'

const route = useRoute()
const analytics = useAnalyticsStore()
const order = ref<Order | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

function orderHeading(orderData: Order) {
  const customerName = getOrderCustomerName(orderData)
  return customerName ? `Terima kasih, ${customerName}.` : 'Terima kasih.'
}

onMounted(async () => {
  try {
    order.value = await getOrder(route.params.secretSlug as string)
    if (order.value) {
      void analytics.handleOrderPagePurchase(order.value)
    }
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="order-page">
    <div v-if="loading" class="state-block">Memuat pesanan...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="order" class="order-content">
      <div class="success-banner">
        <span class="eyebrow">Pesanan berhasil</span>
        <h1>{{ orderHeading(order) }}</h1>
        <p>Silakan lanjutkan pembayaran sesuai instruksi di bawah agar pesanan Anda segera diproses.</p>
      </div>
      <PaymentInstructions :order="order" />
      <RouterLink to="/" class="btn-continue">Lanjut Belanja</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.order-page {
  max-width: 760px;
  margin: 0 auto;
  padding-top: 34px;
}

.state-block {
  text-align: center;
  padding: 64px 16px;
  color: var(--sf-ink-soft);
}

.error {
  background: #fff4ef;
  border: 1px solid var(--sf-accent-soft);
  color: var(--sf-accent-strong);
  padding: 16px 18px;
  border-radius: 18px;
}

.order-content {
  display: grid;
  gap: 18px;
}

.success-banner {
  background: linear-gradient(135deg, #f7fbf8 0%, #fdf8f2 100%);
  border: 1px solid var(--sf-line);
  border-radius: 24px;
  padding: 24px;
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
  font-size: clamp(28px, 4vw, 42px);
  font-weight: 500;
  line-height: 1.04;
  letter-spacing: -0.04em;
  margin-bottom: 10px;
}

.success-banner p {
  color: var(--sf-ink-soft);
}

.btn-continue {
  width: fit-content;
  padding: 14px 20px;
  border-radius: 999px;
  border: 1px solid var(--sf-accent);
  background: var(--sf-accent);
  color: var(--sf-accent-contrast);
  text-decoration: none;
  font-weight: 600;
}
</style>
