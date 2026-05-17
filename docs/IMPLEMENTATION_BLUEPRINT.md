# Implementation Blueprint

Dokumen ini menjelaskan pola implementasi final repo ini agar storefront yang sama bisa diduplikasi ke store Scalev lain tanpa mengulang keputusan arsitektur dari nol.

## Prinsip Arsitektur

Repo ini mengikuti model:

1. `1 store Scalev`
2. `1 repository`
3. `1 Cloudflare Pages project`
4. `1 KV namespace untuk settings`
5. `1 admin panel` per store

Tujuannya:

- tiap store terisolasi
- branding dan visibility bisa diatur per store
- deploy tetap sederhana
- LLM lain bisa meluncurkan store baru dengan pola yang sama

## Rule Inti

### 1. Storefront API v3 harus direct dari browser

Semua endpoint Storefront API v3 dipanggil langsung dari browser ke `https://api.scalev.com`.

Contohnya:

- katalog
- detail produk
- keranjang
- checkout
- payment methods
- order detail
- analytics / conversion events

Alasan:

- rate limiter Scalev v3 memang didesain untuk direct browser usage
- jika diproxy, banyak user akan terlihat berasal dari IP yang sama
- hal itu bisa merusak:
  - rate limiting
  - duplicate order protection
  - spam detection
  - heuristik provider pembayaran

Dokumen khususnya ada di [docs/STOREFRONT_API_V3_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/STOREFRONT_API_V3_GUIDE.md).
Untuk tracking dan pixel, baca juga [docs/CONVERSION_EVENT_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/CONVERSION_EVENT_GUIDE.md).

### 2. Backend internal hanya untuk kebutuhan non-Scalev

Cloudflare Pages Functions di repo ini dipakai hanya untuk:

- `/admin-api`
  - login admin
  - session admin
  - update settings storefront
- `/storefront-api/settings`
  - expose public settings milik storefront ini
- HTML injection di [functions/[[path]].ts](/Users/armyalghifari/Documents/Github/storefront/functions/[[path]].ts)
  - inject public settings ke HTML awal
  - inject base Meta Pixel snippet bila aktif

Cloudflare Functions **bukan** dipakai sebagai proxy Storefront API v3.

## Peta Responsibility

### Browser / Frontend

Frontend bertanggung jawab untuk:

- fetch katalog dan product detail dari Scalev
- kelola guest token Scalev di browser
- kelola cart
- membuat order checkout
- render payment selection
- redirect ke payment page Scalev untuk metode redirect
- firing Meta browser events
- filter hidden item berdasarkan public settings

File penting:

- [src/api/client.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/client.ts)
- [src/api/catalog.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/catalog.ts)
- [src/api/cart.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/cart.ts)
- [src/api/checkout.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/checkout.ts)
- [src/stores/analytics.ts](/Users/armyalghifari/Documents/Github/storefront/src/stores/analytics.ts)

### Cloudflare KV

KV menjadi source of truth untuk settings storefront milik store ini:

- visibility item
- branding
- hero title/subtitle
- catalog section settings
- warna button / harga
- payment methods yang diizinkan tampil
- WhatsApp confirmation config
- Meta Ads config

File penting:

- [functions/_lib/settings.ts](/Users/armyalghifari/Documents/Github/storefront/functions/_lib/settings.ts)
- [functions/_lib/types.ts](/Users/armyalghifari/Documents/Github/storefront/functions/_lib/types.ts)

### Admin Panel

`/admin` dipakai untuk mengatur:

- item visible/hidden
- nama toko
- hero copy
- warna UI
- payment methods yang mau dipakai
- WhatsApp destination
- Meta Pixel config

File penting:

- [src/views/AdminView.vue](/Users/armyalghifari/Documents/Github/storefront/src/views/AdminView.vue)
- [src/api/admin.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/admin.ts)
- [functions/admin-api/settings.ts](/Users/armyalghifari/Documents/Github/storefront/functions/admin-api/settings.ts)

## Data Flow Penting

### Home / Catalog

1. Browser fetch Scalev public items.
2. Browser fetch `/storefront-api/settings`.
3. Hidden item keys dari settings dipakai untuk memfilter katalog di browser.
4. UI merender hanya item yang visible.

File terkait:

- [src/api/catalog.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/catalog.ts)
- [src/stores/storefrontSettings.ts](/Users/armyalghifari/Documents/Github/storefront/src/stores/storefrontSettings.ts)
- [src/utils/visibility.ts](/Users/armyalghifari/Documents/Github/storefront/src/utils/visibility.ts)

### Product Detail

1. Browser fetch detail produk/bundle dari Scalev.
2. Browser cek apakah item disembunyikan menurut public settings.
3. Jika hidden, FE melempar error agar item tidak tampil di storefront publik.

### Cart

1. Browser memanggil cart endpoint v3 langsung ke Scalev.
2. `x-scalev-guest-token` disimpan di localStorage.
3. Guest token itu dipakai ulang untuk cart dan checkout berikutnya.

### Checkout

1. Browser isi data customer / shipping.
2. Browser fetch shipping summary langsung ke Scalev bila perlu.
3. Browser create order langsung ke Scalev.
4. Setelah sukses:
   - purchase tracking dijalankan
   - guest token/cart direset
   - kalau metode bayar butuh redirect, browser diarahkan ke `payment_url`
   - kalau transfer manual, user masuk ke halaman order internal

File penting:

- [src/views/CheckoutView.vue](/Users/armyalghifari/Documents/Github/storefront/src/views/CheckoutView.vue)
- [src/api/checkout.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/checkout.ts)
- [src/stores/cart.ts](/Users/armyalghifari/Documents/Github/storefront/src/stores/cart.ts)

### Order Page

1. Browser fetch public order detail dari Scalev.
2. FE menormalisasi customer name/email/phone dari shape payload Scalev.
3. Instruksi pembayaran ditampilkan sesuai metode bayar:
   - `bank_transfer`: tampilkan rekening
   - metode redirect: tampilkan CTA ke halaman pembayaran resmi Scalev bila diperlukan

File penting:

- [src/views/OrderView.vue](/Users/armyalghifari/Documents/Github/storefront/src/views/OrderView.vue)
- [src/components/PaymentInstructions.vue](/Users/armyalghifari/Documents/Github/storefront/src/components/PaymentInstructions.vue)
- [src/utils/order.ts](/Users/armyalghifari/Documents/Github/storefront/src/utils/order.ts)

## Fitur yang Sudah Distandardisasi

### Visibility Produk

- Visibility tidak lagi dipaksa di layer proxy
- Visibility disimpan di KV
- Public settings mengirim `hiddenItemKeys`
- Frontend yang memfilter item

Keuntungan:

- tetap konsisten dengan aturan “jangan proxy Storefront API v3”
- tetap memungkinkan merchandising per store

### Payment Methods

- daftar metode bayar aktif dibaca dari Scalev
- `/admin` dapat membatasi metode mana yang ingin tampil
- checkout FE menampilkan irisan dari:
  - aktif di Scalev
  - diizinkan di settings storefront

### Redirect Payment

- metode redirect seperti `invoice` atau `qris` diarahkan ke payment page resmi Scalev setelah order berhasil dibuat
- transfer bank tetap memakai order page internal untuk menampilkan rekening

### Meta Pixel

- base snippet diinject di HTML awal
- settings pixel dibaca dari public storefront settings
- event lanjutan ditrigger dari runtime app

Dokumen detailnya ada di [docs/CONVERSION_EVENT_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/CONVERSION_EVENT_GUIDE.md).

## Hal yang Harus Tetap Dipertahankan Saat Duplikasi

- jangan buat proxy baru untuk Storefront API v3
- jangan campurkan beberapa store ke satu KV namespace
- jangan gunakan satu Pages project untuk beberapa store berbeda
- jangan commit secret production ke repo
- jangan deploy manual dari lokal

## File yang Biasanya Disentuh Saat Clone Store Baru

- [wrangler.jsonc](/Users/armyalghifari/Documents/Github/storefront/wrangler.jsonc)
- Cloudflare env vars dan secrets
- KV namespace binding
- `/admin` settings setelah site live

## File yang Biasanya Tidak Perlu Diubah

- [src/api/client.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/client.ts)
- [src/api/catalog.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/catalog.ts)
- [src/api/cart.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/cart.ts)
- [src/api/checkout.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/checkout.ts)
- [functions/admin-api](/Users/armyalghifari/Documents/Github/storefront/functions/admin-api)
- [functions/storefront-api/settings.ts](/Users/armyalghifari/Documents/Github/storefront/functions/storefront-api/settings.ts)

Artinya, untuk store berikutnya idealnya yang berubah adalah konfigurasi dan konten, bukan arsitektur dasar.
