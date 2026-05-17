# Store Duplication Checklist

This checklist exists so the storefront pattern in this repository can be duplicated for another Scalev store in a consistent way.

## 1. Prepare the New Store Identity

- define `store_slug`
- define `store name`
- prepare `VITE_SCALEV_STORE_UNIQUE_ID`
- prepare `VITE_SCALEV_STOREFRONT_API_KEY`
- choose the new GitHub owner/repository
- choose the Cloudflare account to use

Use the naming rules from [docs/NAMING_CONVENTIONS.md](/Users/armyalghifari/Documents/Github/storefront/docs/NAMING_CONVENTIONS.md).

## 2. Duplicate the Repository

- create a new repository from this starter
- point `origin` to the new repository
- keep the production branch as `main`

## 3. Bootstrap the Store Configuration

Run:

```bash
npm install
npm run bootstrap:store -- --store-slug <store-slug> --kv-id <kv-namespace-id>
```

Then:

- copy `.env.example` to `.env`
- fill in:
  - `VITE_SCALEV_STORE_UNIQUE_ID`
  - `VITE_SCALEV_STOREFRONT_API_KEY`

## 4. Create Cloudflare Resources

Required:

- 1 new Pages project
- 1 new KV namespace

Pages settings:

- production branch: `main`
- build command: `npm run build`
- output directory: `dist`

Bindings / secrets:

- KV binding: `STOREFRONT_SETTINGS`
- env: `VITE_SCALEV_STORE_UNIQUE_ID`
- env: `VITE_SCALEV_STOREFRONT_API_KEY`
- secret: `ADMIN_PASSWORD`
- secret: `ADMIN_SESSION_SECRET`

## 5. Confirm There Is No Storefront API v3 Proxy

Verify:

- the storefront does not use `/scalev-api`
- Storefront API v3 is called directly from the browser
- no backend layer proxies v3 endpoints

See [docs/STOREFRONT_API_V3_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/STOREFRONT_API_V3_GUIDE.md).

## 6. Push to GitHub

- commit the relevant setup changes
- push to `main`
- wait for the Cloudflare deployment to finish

## 7. Verify The Live Store

- homepage `/` loads correctly
- catalog appears
- `/admin` can log in
- hidden item toggles work
- `/storefront-api/settings` returns `200`
- add to cart works
- checkout works
- order creation works
- the recorded order IP is the client IP, not a shared proxy IP

## 8. Fill Initial Merchandising In `/admin`

- store name
- hero title
- hero subtitle
- catalog title
- button color
- price text color
- allowed payment methods
- WhatsApp confirmation number
- item visibility
- Meta Pixel settings

## 9. Save Launch Evidence

After launch, save at least:

- production URL
- Cloudflare project name
- KV namespace name
- GitHub repository
- store slug
- launch date

This makes future duplication or auditing much easier.
