# Store Duplication Checklist

Checklist ini dibuat agar pola storefront ini bisa diduplikasi ke store Scalev lain secara konsisten.

## 1. Siapkan Identitas Store Baru

- tentukan `store_slug`
- tentukan `store name`
- siapkan `VITE_SCALEV_STORE_UNIQUE_ID`
- siapkan `VITE_SCALEV_STOREFRONT_API_KEY`
- tentukan GitHub owner/repo baru
- tentukan Cloudflare account yang akan dipakai

Gunakan naming convention dari [docs/NAMING_CONVENTIONS.md](/Users/armyalghifari/Documents/Github/storefront/docs/NAMING_CONVENTIONS.md).

## 2. Duplikasi Repo

- buat repo baru dari starter ini
- arahkan `origin` ke repo baru
- pastikan branch production tetap `main`

## 3. Bootstrap Konfigurasi Store

Jalankan:

```bash
npm install
npm run bootstrap:store -- --store-slug <store-slug> --kv-id <kv-namespace-id>
```

Lalu:

- copy `.env.example` ke `.env`
- isi:
  - `VITE_SCALEV_STORE_UNIQUE_ID`
  - `VITE_SCALEV_STOREFRONT_API_KEY`

## 4. Buat Resource Cloudflare

Wajib:

- 1 Pages project baru
- 1 KV namespace baru

Setting Pages:

- production branch: `main`
- build command: `npm run build`
- output dir: `dist`

Bindings/secrets:

- KV binding: `STOREFRONT_SETTINGS`
- env: `VITE_SCALEV_STORE_UNIQUE_ID`
- env: `VITE_SCALEV_STOREFRONT_API_KEY`
- secret: `ADMIN_PASSWORD`
- secret: `ADMIN_SESSION_SECRET`

## 5. Pastikan Tidak Ada Proxy Storefront API v3

Verifikasi:

- storefront tidak memakai `/scalev-api`
- Storefront API v3 dipanggil langsung dari browser
- tidak ada backend baru yang memproxy endpoint v3

Lihat [docs/STOREFRONT_API_V3_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/STOREFRONT_API_V3_GUIDE.md).

## 6. Push ke GitHub

- commit perubahan setup yang memang relevan
- push ke `main`
- tunggu deployment Cloudflare selesai

## 7. Verifikasi Live

- homepage `/` load normal
- katalog muncul
- `/admin` bisa login
- hidden item bisa diubah
- `/storefront-api/settings` balas `200`
- add to cart berhasil
- checkout berhasil
- order berhasil dibuat
- IP order terbaca sebagai IP client, bukan IP proxy

## 8. Isi Merchandising Awal di `/admin`

- nama toko
- hero title
- hero subtitle
- catalog title
- button color
- price text color
- payment methods yang diizinkan tampil
- WhatsApp confirmation number
- item visibility
- Meta Pixel settings

## 9. Simpan Bukti Launch

Setelah live, simpan minimal:

- URL production
- Cloudflare project name
- KV namespace name
- repo GitHub
- store slug
- tanggal launch

Ini akan memudahkan kalau store serupa harus diduplikasi lagi.
