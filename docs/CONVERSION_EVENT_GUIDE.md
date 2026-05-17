# Conversion Event Guide

Dokumen ini menjelaskan best practice implementasi conversion event untuk storefront headless yang memakai Scalev Storefront API v3 dan Meta Pixel.

Tujuannya adalah mencegah LLM lain atau developer lain mengarang arsitektur tracking yang tidak sesuai dengan pola repo ini.

## Hard Rules

### 1. Jangan proxy endpoint conversion Storefront API v3

Endpoint analytics / conversion dari Scalev Storefront API v3 harus dipanggil langsung dari browser, sama seperti endpoint v3 lainnya.

Jangan kirim endpoint conversion melalui:

- backend sendiri
- reverse proxy
- middleware
- edge function
- Cloudflare Worker / Pages Function
- serverless pass-through API

Alasan:

- Storefront API v3 didesain untuk direct browser usage
- rate limiter bersifat strict
- proxy dapat membuat banyak user terlihat berasal dari IP yang sama
- heuristik spam, duplicate protection, dan attribution bisa terganggu

## Mental Model yang Dipakai Repo Ini

Tracking dibagi menjadi dua lapis:

1. **Base pixel bootstrap**
2. **Runtime event firing**

### Base pixel bootstrap

Base pixel harus tersedia sangat awal di HTML awal storefront.

Di repo ini, base snippet diinject lewat:

- [functions/[[path]].ts](/Users/armyalghifari/Documents/Github/storefront/functions/[[path]].ts)

Yang dilakukan:

- inject public storefront settings ke HTML
- inject base Meta Pixel snippet bila Meta aktif
- fire `PageView` base dari snippet awal

Ini penting karena event helper seperti Meta Pixel Helper sering gagal mendeteksi pixel jika bootstrap datang terlalu terlambat atau hanya setelah fetch async frontend selesai.

### Runtime event firing

Event setelah page load ditangani dari aplikasi frontend.

File utama:

- [src/stores/analytics.ts](/Users/armyalghifari/Documents/Github/storefront/src/stores/analytics.ts)

Frontend bertanggung jawab untuk:

- `ViewContent`
- `AddToCart`
- `InitiateCheckout`
- `Purchase`

## Event Sequence yang Harus Diikuti

### 1. `PageView`

`PageView` adalah baseline event pertama.

Prinsip:

- base snippet harus siap lebih dulu
- storefront page pertama harus memicu `PageView`
- route change berikutnya juga harus dapat memicu page view runtime bila diperlukan

### 2. `ViewContent`

Trigger saat halaman detail produk atau bundle berhasil dimuat dan item yang aktif sudah jelas.

Di repo ini:

- product detail → `trackMetaViewContentForProduct(...)`
- bundle detail → `trackMetaViewContentForBundle(...)`

### 3. `AddToCart`

Trigger saat user benar-benar menambah item ke keranjang.

Prinsip:

- event browser boleh ditembak secepat mungkin dari konteks produk aktif
- relay ke Scalev tetap harus menjaga kesesuaian dengan item yang benar
- jangan bergantung pada lookup cart yang rapuh jika konteks item aktif sudah tersedia di halaman

### 4. `InitiateCheckout`

Trigger saat user benar-benar memasuki fase checkout dengan cart yang ada.

Di repo ini, event ini ditembak dari konteks cart saat checkout dimulai.

### 5. `Purchase`

`Purchase` harus mengikuti trigger yang dipilih di settings:

- `checkout_success`
- `order_paid`

Jangan menembak keduanya sekaligus.

## Dedupe Rule

Browser event dan server relay untuk event yang sama harus memakai `event_id` yang sama.

Ini penting terutama untuk:

- `AddToCart`
- `InitiateCheckout`
- `Purchase`

Di repo ini, event ID dikelola di store analytics agar:

- browser event tetap terbaca oleh helper/tools
- server relay ke Scalev tetap bisa dilakukan
- Meta bisa melakukan dedupe dengan benar

## Browser vs Server Responsibilities

### Browser

Browser harus menangani:

- base snippet availability
- firing Meta browser events
- menyimpan attribution yang relevan
- mengirim relay event ke endpoint Scalev v3 secara direct

### Server / Cloudflare

Cloudflare layer di repo ini **tidak** dipakai untuk memproxy event conversion Scalev v3.

Cloudflare hanya dipakai untuk:

- admin auth/settings
- public storefront settings
- base HTML injection

## Apa yang Tidak Boleh Dilakukan

LLM lain tidak boleh:

- memindahkan endpoint analytics v3 ke proxy internal
- memindahkan checkout ke proxy internal
- membuat event firing baru tanpa event lifecycle yang jelas
- menembak `Purchase` di banyak titik sekaligus
- mengubah base pixel bootstrap menjadi fetch async yang terlambat tanpa alasan kuat
- menyimpulkan “pixel tidak terbaca” sebelum memeriksa timing bootstrap dan environment helper

## Verification Checklist

Saat mengubah tracking, cek minimal:

1. pixel terdeteksi di halaman storefront
2. `PageView` muncul
3. `ViewContent` muncul di detail produk
4. `AddToCart` muncul saat item ditambahkan
5. `InitiateCheckout` muncul saat checkout dimulai
6. `Purchase` hanya muncul pada trigger yang dipilih
7. endpoint analytics v3 tetap dipanggil direct dari browser
8. tidak ada proxy internal baru untuk endpoint v3

## Rule Khusus untuk Repo Ini

Jika store berikutnya diduplikasi dari repo ini, pertahankan aturan berikut:

- Storefront API v3 tetap direct dari browser
- conversion endpoints tetap direct dari browser
- base snippet tetap diinject dari HTML awal
- runtime event logic tetap dipusatkan di [src/stores/analytics.ts](/Users/armyalghifari/Documents/Github/storefront/src/stores/analytics.ts)
- `/admin` hanya mengatur settings, bukan menjadi relay untuk endpoint conversion v3
