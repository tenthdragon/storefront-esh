<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOrder } from '@/api/checkout'
import PaymentInstructions from '@/components/PaymentInstructions.vue'
import type { Order } from '@/types'

const route = useRoute()
const order = ref<Order | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    order.value = await getOrder(route.params.secretSlug as string)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="order-page">
    <div v-if="loading" class="loading">Memuat pesanan...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="order">
      <div class="success-banner">
        <h1>Pesanan Berhasil Dibuat!</h1>
        <p>Terima kasih, <strong>{{ order.customer_name }}</strong>. Silakan lakukan pembayaran sesuai instruksi di bawah.</p>
      </div>
      <PaymentInstructions :order="order" />
      <RouterLink to="/" class="btn-continue">Lanjut Belanja</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.order-page {
  max-width: 600px;
  margin: 0 auto;
}

.loading {
  text-align: center;
  padding: 4rem;
  color: #888;
}

.error {
  background: #fff5f5;
  border: 1px solid #e53e3e;
  color: #e53e3e;
  padding: 1rem;
  border-radius: 6px;
}

.success-banner {
  background: #f0fff4;
  border: 1px solid #22c55e;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 0.5rem;
}

.success-banner h1 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #15803d;
  margin-bottom: 0.5rem;
}

.success-banner p {
  font-size: 0.9rem;
  color: #166534;
}

.btn-continue {
  display: inline-block;
  margin-top: 1.5rem;
  padding: 0.6rem 1.5rem;
  background: #e53e3e;
  color: #fff;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
}
</style>
