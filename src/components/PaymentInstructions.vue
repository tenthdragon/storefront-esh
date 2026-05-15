<script setup lang="ts">
import type { Order } from '@/types'

defineProps<{ order: Order }>()

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)
}
</script>

<template>
  <div class="payment-box">
    <h3>Instruksi Pembayaran</h3>

    <div class="summary-row">
      <span>Total Produk</span>
      <span>{{ formatPrice(order.product_price - order.product_discount) }}</span>
    </div>
    <div class="summary-row">
      <span>Ongkos Kirim</span>
      <span>{{ formatPrice(order.shipping_cost - order.shipping_discount) }}</span>
    </div>
    <div class="summary-row total">
      <span>Total Bayar</span>
      <span>{{ formatPrice(order.gross_revenue) }}</span>
    </div>

    <div v-if="order.payment_url" class="pay-url">
      <a :href="order.payment_url" target="_blank" class="btn-pay">Bayar Sekarang</a>
    </div>

    <div v-if="order.store?.payment_accounts?.length" class="bank-accounts">
      <p class="label">Transfer ke:</p>
      <div v-for="acc in order.store.payment_accounts" :key="acc.account_number" class="account">
        <strong>{{ acc.bank_name }}</strong>
        <span>{{ acc.account_number }}</span>
        <span>a.n. {{ acc.account_name }}</span>
      </div>
    </div>

    <div v-if="order.chat_message" class="chat-msg">
      <p class="label">Pesan konfirmasi:</p>
      <pre>{{ order.chat_message }}</pre>
    </div>
  </div>
</template>

<style scoped>
.payment-box {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
}

h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  font-size: 0.9rem;
  border-bottom: 1px solid #f0f0f0;
}

.summary-row.total {
  font-weight: 700;
  font-size: 1rem;
  color: #e53e3e;
  border-bottom: none;
  margin-top: 0.25rem;
}

.pay-url {
  margin-top: 1rem;
}

.btn-pay {
  display: inline-block;
  background: #e53e3e;
  color: #fff;
  padding: 0.6rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
}

.bank-accounts {
  margin-top: 1rem;
}

.label {
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #555;
}

.account {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  background: #f8f8f8;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.chat-msg {
  margin-top: 1rem;
}

.chat-msg pre {
  background: #f0f0f0;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
