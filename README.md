# Scalev Headless Storefront Starter

Starter ini dipakai untuk membuat satu storefront headless per store Scalev.

Arsitektur yang direkomendasikan bukan satu aplikasi untuk banyak store, melainkan:

1. `1 Scalev store`
2. `1 GitHub repository`
3. `1 Cloudflare Pages project`
4. `1 KV namespace untuk settings`
5. `1 /admin` yang mengatur branding, hero, theme, dan visibilitas item untuk store tersebut

Pendekatan ini membuat setiap store tetap terisolasi, mudah di-branding ulang, dan aman untuk dideploy lewat GitHub tanpa saling memengaruhi.

## Fitur

- Katalog, detail produk, keranjang, checkout, dan order view
- Admin panel di `/admin`
- Visibility produk dan bundle per store
- Branding store name, hero title, hero subtitle, catalog section title
- Theme button color dan warna tulisan harga
- Filter katalog melalui settings publik + KV
- Deploy production hanya lewat GitHub + Cloudflare Pages Git integration

## Arsitektur Inti

- Frontend: Vue 3 + Vite
- Routing: Vue Router
- State: Pinia
- API publik: Scalev Storefront API v3 dipanggil langsung dari browser
- Edge layer: Cloudflare Pages Functions
- Settings admin: Cloudflare KV (`STOREFRONT_SETTINGS`)
- Production deploy: GitHub push ke branch `main`

## File Penting

- [src/api/client.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/client.ts): koneksi ke Scalev storefront API
- [functions/admin-api](/Users/armyalghifari/Documents/Github/storefront/functions/admin-api): auth dan admin settings API
- [functions/storefront-api/settings.ts](/Users/armyalghifari/Documents/Github/storefront/functions/storefront-api/settings.ts): public settings endpoint
- [functions/_lib/settings.ts](/Users/armyalghifari/Documents/Github/storefront/functions/_lib/settings.ts): default settings, normalisasi, save/load KV
- [wrangler.jsonc](/Users/armyalghifari/Documents/Github/storefront/wrangler.jsonc): binding Cloudflare project
- [DEPLOYMENT_POLICY.md](/Users/armyalghifari/Documents/Github/storefront/DEPLOYMENT_POLICY.md): aturan deploy production

## Model Replikasi Store

Untuk store baru, duplikasi repo ini sebagai starter.

Jangan pakai satu repo untuk banyak store yang berbeda kecuali nanti memang sengaja direfactor menjadi platform multi-tenant.

Model yang disarankan:

1. Buat repo baru dari starter ini.
2. Hubungkan repo baru ke Pages project baru.
3. Buat KV namespace baru.
4. Isi env vars dan secrets store baru.
5. Push ke `main`.
6. Selesaikan kurasi storefront lewat `/admin`.

## Quick Start

1. Copy [`.env.example`](/Users/armyalghifari/Documents/Github/storefront/.env.example) ke `.env` untuk local development.
2. Isi:
   - `VITE_SCALEV_STORE_UNIQUE_ID`
   - `VITE_SCALEV_STOREFRONT_API_KEY`
3. Jalankan `npm install`
4. Jika ini adalah repo hasil duplikasi untuk store baru, jalankan bootstrap:

```bash
npm run bootstrap:store -- --store-slug army-alghifari --kv-id your_kv_namespace_id
```

5. Jalankan `npm run dev`
6. Saat siap production, buat Pages project baru dengan GitHub integration.
7. Tambahkan env vars, secrets, dan KV binding di Cloudflare.
8. Push ke `main` untuk deploy production.

## Bootstrap Store Baru

Perintah ini dibuat agar repo duplikat bisa langsung dipindahkan ke identitas store baru tanpa edit manual `wrangler.jsonc`.

Contoh:

```bash
npm run bootstrap:store -- --store-slug army-alghifari --kv-id 1234567890abcdef1234567890abcdef
```

Flag yang tersedia:

- `--store-slug` wajib, harus `kebab-case`
- `--pages-project` opsional, default `storefront-{store_slug}`
- `--kv-id` opsional, default placeholder `your_kv_namespace_id`
- `--compatibility-date` opsional, default mengambil nilai yang ada sekarang

File yang diubah:

- [wrangler.jsonc](/Users/armyalghifari/Documents/Github/storefront/wrangler.jsonc)

## Naming Convention

Naming convention berarti semua resource store memakai nama yang konsisten dan bisa ditebak.

Contoh yang baik untuk store dengan slug `army-alghifari`:

- GitHub repo: `storefront-army-alghifari`
- Cloudflare Pages project: `storefront-army-alghifari`
- KV namespace: `army-alghifari-storefront-settings`
- Admin URL: `/admin`

Dokumen lengkapnya ada di [docs/NAMING_CONVENTIONS.md](/Users/armyalghifari/Documents/Github/storefront/docs/NAMING_CONVENTIONS.md).

## Dokumen Operasional

- [docs/CONVERSION_EVENT_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/CONVERSION_EVENT_GUIDE.md)
- [docs/IMPLEMENTATION_BLUEPRINT.md](/Users/armyalghifari/Documents/Github/storefront/docs/IMPLEMENTATION_BLUEPRINT.md)
- [docs/LLM_STORE_LAUNCH_RUNBOOK.md](/Users/armyalghifari/Documents/Github/storefront/docs/LLM_STORE_LAUNCH_RUNBOOK.md)
- [docs/NAMING_CONVENTIONS.md](/Users/armyalghifari/Documents/Github/storefront/docs/NAMING_CONVENTIONS.md)
- [docs/STORE_DUPLICATION_CHECKLIST.md](/Users/armyalghifari/Documents/Github/storefront/docs/STORE_DUPLICATION_CHECKLIST.md)
- [docs/STORE_CONFIG_TEMPLATE.md](/Users/armyalghifari/Documents/Github/storefront/docs/STORE_CONFIG_TEMPLATE.md)
- [docs/STOREFRONT_API_V3_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/STOREFRONT_API_V3_GUIDE.md)

## Catatan Penting

- Jangan commit env production yang berisi store ID atau API key store tertentu.
- Simpan env vars dan secrets production di Cloudflare Pages, bukan di git.
- KV harus dibuat per store, jangan dipakai bersama untuk store yang berbeda.
- `npm run deploy` memang diblok. Production release hanya boleh lewat GitHub ke `main`.
- Setelah repo diduplikasi untuk store baru, jalankan `npm run bootstrap:store` sebelum setup Cloudflare.
- Jangan pernah memproxy Storefront API v3 melalui backend atau edge layer sendiri. Lihat [docs/STOREFRONT_API_V3_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/STOREFRONT_API_V3_GUIDE.md).

## Prompt Handoff untuk LLM Lain

Jika storefront baru nanti akan dibantu oleh LLM lain, prompt awal yang aman dan efektif adalah:

> Gunakan [docs/IMPLEMENTATION_BLUEPRINT.md](/Users/armyalghifari/Documents/Github/storefront/docs/IMPLEMENTATION_BLUEPRINT.md), [docs/CONVERSION_EVENT_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/CONVERSION_EVENT_GUIDE.md), [docs/LLM_STORE_LAUNCH_RUNBOOK.md](/Users/armyalghifari/Documents/Github/storefront/docs/LLM_STORE_LAUNCH_RUNBOOK.md), [docs/STORE_DUPLICATION_CHECKLIST.md](/Users/armyalghifari/Documents/Github/storefront/docs/STORE_DUPLICATION_CHECKLIST.md), dan [docs/STORE_CONFIG_TEMPLATE.md](/Users/armyalghifari/Documents/Github/storefront/docs/STORE_CONFIG_TEMPLATE.md). Bantu saya membuat storefront baru dari starter ini sampai live di Cloudflare Pages. Jangan deploy manual dari lokal. Pakai GitHub sebagai source of truth. Tanyakan hanya input yang benar-benar belum ada, lalu kerjakan sisanya end-to-end.
