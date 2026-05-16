<script setup lang="ts">
import { computed } from 'vue'
import { useStorefrontSettingsStore } from '@/stores/storefrontSettings'
import type { Order, PaymentAccount } from '@/types'

const props = defineProps<{ order: Order }>()

const storefrontSettings = useStorefrontSettingsStore()
void storefrontSettings.fetchSettings()

function toNumber(value: number | string | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatPrice(price: number | string) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(toNumber(price))
}

function normalizeWhatsappNumber(value: string) {
  return value.replace(/\D/g, '')
}

function decodeChatMessage(message?: string) {
  if (!message) return ''

  try {
    return decodeURIComponent(message.replace(/\+/g, '%20')).trim()
  } catch {
    return message.replace(/\+/g, ' ').trim()
  }
}

function getBankName(account: PaymentAccount) {
  return account.financial_entity?.name || account.bank_name || 'Transfer Bank'
}

function getAccountHolder(account: PaymentAccount) {
  return account.account_holder || account.account_name || ''
}

function normalizePaymentMethod(value?: string) {
  return (value ?? '').trim().toLowerCase()
}

const paymentAccounts = computed(() => props.order.store?.payment_accounts ?? [])
const productTotal = computed(() => toNumber(props.order.product_price) - toNumber(props.order.product_discount))
const shippingTotal = computed(() => toNumber(props.order.shipping_cost) - toNumber(props.order.shipping_discount))
const uniqueCodeDiscount = computed(() => Math.max(0, toNumber(props.order.unique_code_discount)))
const shouldShowPayButton = computed(() =>
  Boolean(props.order.payment_url) && normalizePaymentMethod(props.order.payment_method) !== 'bank_transfer',
)
const whatsappNumber = computed(() =>
  normalizeWhatsappNumber(storefrontSettings.settings.checkout.whatsappNumber || ''),
)
const whatsappButtonLabel = computed(() =>
  storefrontSettings.settings.checkout.whatsappButtonLabel || 'Konfirmasi via WhatsApp',
)
const confirmationMessage = computed(() => {
  const decoded = decodeChatMessage(props.order.chat_message)
  if (decoded) return decoded

  const reference = props.order.secret_slug || String(props.order.id)
  return `Halo, saya sudah melakukan pemesanan ${reference} atas nama ${props.order.customer_name}. Mohon dibantu cek ya.`
})
const confirmationWhatsappUrl = computed(() => {
  if (!whatsappNumber.value) return ''
  return `https://wa.me/${whatsappNumber.value}?text=${encodeURIComponent(confirmationMessage.value)}`
})
const showConfirmationSection = computed(() =>
  Boolean(confirmationWhatsappUrl.value || confirmationMessage.value),
)
</script>

<template>
  <div class="payment-box">
    <h3>Instruksi Pembayaran</h3>

    <div class="summary-row">
      <span>Total Produk</span>
      <span>{{ formatPrice(productTotal) }}</span>
    </div>
    <div class="summary-row">
      <span>Ongkos Kirim</span>
      <span>{{ formatPrice(shippingTotal) }}</span>
    </div>
    <div v-if="uniqueCodeDiscount > 0" class="summary-row discount">
      <span>Kode Unik</span>
      <span>-{{ formatPrice(uniqueCodeDiscount) }}</span>
    </div>
    <div class="summary-row total">
      <span>Total Bayar</span>
      <span>{{ formatPrice(order.gross_revenue) }}</span>
    </div>

    <div v-if="shouldShowPayButton" class="pay-url">
      <a :href="order.payment_url" target="_blank" rel="noreferrer noopener" class="btn-pay">Bayar Sekarang</a>
    </div>

    <div v-if="paymentAccounts.length" class="bank-accounts">
      <p class="label">Transfer ke</p>
      <div v-for="account in paymentAccounts" :key="account.id ?? account.account_number" class="account">
        <strong>{{ getBankName(account) }}</strong>
        <span class="account-number">{{ account.account_number }}</span>
        <span v-if="getAccountHolder(account)" class="account-holder">a.n. {{ getAccountHolder(account) }}</span>
      </div>
    </div>

    <div v-if="showConfirmationSection" class="chat-msg">
      <p class="label">Konfirmasi pembayaran</p>
      <p class="chat-copy">Setelah transfer, kirim konfirmasi agar pesanan Anda bisa lebih cepat diproses.</p>
      <a
        v-if="confirmationWhatsappUrl"
        :href="confirmationWhatsappUrl"
        target="_blank"
        rel="noreferrer noopener"
        class="btn-wa"
      >
        {{ whatsappButtonLabel }}
      </a>
      <p v-if="confirmationWhatsappUrl" class="wa-note">Pesan akan terisi otomatis saat WhatsApp dibuka.</p>
      <div class="chat-preview">{{ confirmationMessage }}</div>
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

.summary-row.discount {
  color: #2f6d42;
}

.summary-row.total {
  color: var(--sf-accent-strong);
  font-weight: 700;
  border-bottom: none;
}

.btn-pay,
.btn-wa {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  border-radius: 999px;
  border: 1px solid var(--sf-accent);
  background: var(--sf-accent);
  color: var(--sf-accent-contrast);
  padding: 14px 20px;
  text-decoration: none;
  font-weight: 600;
}

.btn-wa {
  width: 100%;
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

.account-number {
  font-size: 1.05rem;
  color: var(--sf-ink);
}

.account-holder {
  color: var(--sf-ink-soft);
}

.chat-copy,
.wa-note {
  color: var(--sf-ink-soft);
  font-size: 0.95rem;
}

.chat-preview {
  background: #fffdf9;
  border: 1px solid var(--sf-line);
  border-radius: 18px;
  padding: 16px;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--sf-ink-soft);
}
</style>
