# Naming Conventions

Dokumen ini menjelaskan maksud dari "naming convention repo" untuk storefront headless ini.

Tujuannya sederhana:

- semua resource memakai nama yang konsisten
- LLM atau operator manusia mudah menebak relasi antar-resource
- tidak ada bentrok saat Anda punya banyak store

## Prinsip Dasar

Pilih satu `store slug` yang stabil untuk setiap store.

Aturannya:

- lowercase semua
- gunakan `kebab-case`
- hindari spasi
- hindari nama yang berubah-ubah seperti `final`, `baru`, `test2`
- hindari memasukkan nama campaign jangka pendek

## Pola Nama yang Direkomendasikan

Jika `store_slug = army-alghifari`, gunakan:

| Resource | Format | Contoh |
| --- | --- | --- |
| GitHub repo | `storefront-{store_slug}` | `storefront-army-alghifari` |
| Cloudflare Pages project | `storefront-{store_slug}` | `storefront-army-alghifari` |
| KV namespace | `{store_slug}-storefront-settings` | `army-alghifari-storefront-settings` |
| Branch production | `main` | `main` |
| Admin URL | `/admin` | `/admin` |
| Pages subdomain | `{pages_project}.pages.dev` | `storefront-army-alghifari.pages.dev` |

## Jika Satu Business Punya Banyak Store

Gunakan slug yang tetap unik, misalnya:

- `roove-meta-ads`
- `roove-cavac-model`
- `army-alghifari`
- `army-digital-class`

Lalu resource-nya mengikuti:

- `storefront-roove-meta-ads`
- `storefront-roove-cavac-model`
- `storefront-army-alghifari`

## Kenapa Repo dan Pages Project Sebaiknya Sama

Kalau repo dan Pages project memakai nama yang sama, proses operasi jadi lebih ringan:

- mudah dicari di GitHub
- mudah dicocokkan di Cloudflare
- runbook LLM lebih sederhana
- kecil risiko salah deploy ke project lain

## Anti-Pattern

Hindari pola seperti:

- `storefront-final`
- `storefront-baru-banget`
- `army storefront`
- `StoreFrontArmy`
- satu repo dipakai untuk beberapa store yang tidak berhubungan

## Rekomendasi Praktis

Kalau ragu, pakai format ini:

- repo: `storefront-{store_slug}`
- pages project: `storefront-{store_slug}`
- KV: `{store_slug}-storefront-settings`

Itu sudah cukup rapi, mudah diaudit, dan enak untuk LLM maupun operator manusia.
