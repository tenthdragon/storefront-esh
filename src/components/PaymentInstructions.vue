<script setup lang="ts">
import type { Order } from '@/types'

defineProps<{ order: Order }>()

function formatPrice(price: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price)
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
      <a :href="order.payment_url" target="_blank" rel="noreferrer noopener" class="btn-pay">Bayar Sekarang</a>
    </div>

    <div v-if="order.store?.payment_accounts?.length" class="bank-accounts">
      <p class="label">Transfer ke</p>
      <div v-for="acc in order.store.payment_accounts" :key="acc.account_number" class="account">
        <strong>{{ acc.bank_name }}</strong>
        <span>{{ acc.account_number }}</span>
        <span>a.n. {{ acc.account_name }}</span>
      </div>
    </div>

    <div v-if="order.chat_message" class="chat-msg">
      <p class="label">Pesan konfirmasi</p>
      <pre>{{ order.chat_message }}</pre>
    </div>
  </div>
</template>

<style scoped>
.payment-box {
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-line);
  border-radius: 24px;
  padding: 24px;
  display: grid;
  gap: 12px;
}

h3 {
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.03em;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  color: var(--sf-ink-soft);
  border-bottom: 1px solid var(--sf-line);
}

.summary-row.total {
  color: var(--sf-accent-strong);
  font-weight: 700;
  border-bottom: none;
}

.btn-pay {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid var(--sf-accent);
  background: var(--sf-accent);
  color: var(--sf-accent-contrast);
  padding: 14px 20px;
  text-decoration: none;
  font-weight: 600;
}

.label {
  font-size: 12px;
  font-family: var(--sf-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sf-ink-soft);
}

.bank-accounts,
.chat-msg {
  display: grid;
  gap: 10px;
}

.account {
  display: grid;
  gap: 4px;
  padding: 16px;
  border-radius: 18px;
  background: #fffdf9;
  border: 1px solid var(--sf-line);
}

.chat-msg pre {
  background: #fffdf9;
  border: 1px solid var(--sf-line);
  border-radius: 18px;
  padding: 16px;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--sf-ink-soft);
}
</style>
