# LLM Store Launch Runbook

Runbook ini dibuat agar LLM lain bisa membantu user membuat storefront baru dari nol dengan arsitektur yang sama seperti repo ini.

## Operating Model

Asumsikan model berikut:

1. satu store Scalev = satu repository
2. satu store Scalev = satu Cloudflare Pages project
3. satu store Scalev = satu KV namespace
4. deploy production hanya lewat GitHub integration ke branch `main`

Jangan gabungkan beberapa store yang berbeda ke satu repository kecuali memang ada keputusan eksplisit untuk membangun platform multi-tenant.

## Input yang Wajib Dikumpulkan

Sebelum mulai, LLM harus memastikan data berikut tersedia:

- store name
- store slug
- GitHub owner
- repo name
- Cloudflare account yang akan dipakai
- `VITE_SCALEV_STORE_UNIQUE_ID`
- `VITE_SCALEV_STOREFRONT_API_KEY`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- custom domain jika ada

Kalau beberapa nama belum dipilih, sarankan default berdasarkan [docs/NAMING_CONVENTIONS.md](/Users/armyalghifari/Documents/Github/storefront/docs/NAMING_CONVENTIONS.md).

## Step 1: Buat Naming yang Konsisten

Turunkan nama resource dari satu `store_slug`.

Default yang direkomendasikan:

- repo: `storefront-{store_slug}`
- pages project: `storefront-{store_slug}`
- KV namespace: `{store_slug}-storefront-settings`

## Step 2: Buat Repository Baru

LLM harus:

1. membuat repo baru dari starter ini atau menduplikasi working tree saat ini ke repo baru
2. memastikan remote `origin` mengarah ke repo store baru
3. menjaga branch production tetap `main`

## Step 3: Rapikan Config Lokal

LLM harus:

1. jalankan bootstrap store:

```bash
npm run bootstrap:store -- --store-slug <store-slug> --kv-id <kv-namespace-id>
```

2. copy `.env.example` ke `.env`
3. isi:
   - `VITE_SCALEV_API_BASE=https://api.scalev.com`
   - `VITE_SCALEV_STORE_UNIQUE_ID`
   - `VITE_SCALEV_STOREFRONT_API_KEY`
4. jalankan `npm install`
5. jalankan `npm run build`
6. jalankan `npm run dev` bila perlu verifikasi lokal

## Step 4: Buat Cloudflare Resources

LLM harus membantu user membuat:

1. Pages project baru dengan GitHub integration
2. KV namespace baru

Pages setup:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`

Bindings dan secrets yang wajib ada:

- KV binding: `STOREFRONT_SETTINGS`
- env var: `VITE_SCALEV_API_BASE`
- env var: `VITE_SCALEV_STORE_UNIQUE_ID`
- env var: `VITE_SCALEV_STOREFRONT_API_KEY`
- secret: `ADMIN_PASSWORD`
- secret: `ADMIN_SESSION_SECRET`

Catatan:

- env vars harus diisi untuk environment production
- kalau preview dipakai, isi preview juga agar branch preview tidak error
- jangan simpan secret production di git
- bila KV namespace belum ada saat bootstrap awal, LLM boleh memakai placeholder lebih dulu lalu mengganti `wrangler.jsonc` setelah KV dibuat

## Step 5: Samakan Repo dengan Cloudflare

Setelah Pages project dibuat, LLM harus memastikan:

- repo GitHub yang terhubung benar
- branch production adalah `main`
- deploy berjalan dari GitHub, bukan direct upload lokal

Kalau perlu, cek aturan di [DEPLOYMENT_POLICY.md](/Users/armyalghifari/Documents/Github/storefront/DEPLOYMENT_POLICY.md).

## Step 6: First Launch

LLM harus:

1. commit perubahan setup yang memang perlu masuk repo
2. push ke `main`
3. tunggu deployment Cloudflare selesai
4. verifikasi URL production

## Step 7: Post-Deploy Verification

LLM harus memverifikasi:

- homepage `/` balas `200`
- `/admin` bisa dibuka
- login admin berhasil
- katalog memuat data produk
- perubahan visibility item tersimpan
- `/storefront-api/settings` balas `200`
- asset live Cloudflare sesuai dengan build commit terakhir

## Step 8: Initial Merchandising

Setelah live, LLM bisa bantu user mengisi:

- store name di navbar
- hero title
- hero subtitle
- catalog section title
- warna tombol
- warna tulisan harga
- item mana yang visible / hidden

## Common Failure Cases

### 1. Storefront `404`

Biasanya:

- `VITE_SCALEV_STORE_UNIQUE_ID` salah
- `VITE_SCALEV_STOREFRONT_API_KEY` salah
- env var production belum diisi di Cloudflare

### 2. `/admin` tidak bisa login

Biasanya:

- `ADMIN_PASSWORD` belum diset
- `ADMIN_SESSION_SECRET` belum diset

### 3. Settings tidak tersimpan

Biasanya:

- `STOREFRONT_SETTINGS` belum dibinding ke KV

### 4. GitHub dan Cloudflare tidak sinkron

Biasanya:

- deploy belum selesai
- repo yang terhubung ke Pages salah
- branch production bukan `main`

## Guardrails

LLM tidak boleh:

- deploy production langsung dari lokal
- menyimpan secret production ke git
- memakai satu KV namespace untuk store yang berbeda
- memakai satu repo yang sama untuk store di Cloudflare account berbeda tanpa mengecek batasan integrasi

## Handoff Prompt yang Direkomendasikan

Kalau user ingin menyerahkan pekerjaan ini ke LLM lain, gunakan prompt:

> Gunakan repo ini sebagai starter satu store. Ikuti [docs/LLM_STORE_LAUNCH_RUNBOOK.md](/Users/armyalghifari/Documents/Github/storefront/docs/LLM_STORE_LAUNCH_RUNBOOK.md) dan [docs/STORE_CONFIG_TEMPLATE.md](/Users/armyalghifari/Documents/Github/storefront/docs/STORE_CONFIG_TEMPLATE.md). Bantu saya membuat storefront baru sampai live di Cloudflare Pages. Gunakan GitHub sebagai source of truth dan jangan deploy manual dari lokal.
