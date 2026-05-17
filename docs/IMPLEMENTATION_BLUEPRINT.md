# Implementation Blueprint

This document explains the final implementation pattern used in this repository so the same storefront architecture can be duplicated for other Scalev stores without rediscovering the core decisions from scratch.

## Architectural Principles

This repository follows the model:

1. `1 Scalev store`
2. `1 repository`
3. `1 Cloudflare Pages project`
4. `1 KV namespace for settings`
5. `1 admin panel` per store

Goals:

- each store stays isolated
- branding and visibility can be managed per store
- deployment remains simple
- another LLM can launch a new store with the same pattern

## Core Rules

### 1. Storefront API v3 must be called directly from the browser

All Storefront API v3 endpoints are called directly from the browser to `https://api.scalev.com`.

Examples:

- catalog
- product detail
- cart
- checkout
- payment methods
- order detail
- analytics / conversion events

Reasons:

- Scalev v3 rate limiting is designed for direct browser usage
- if requests are proxied, many users may appear to come from the same IP
- that can break:
  - rate limiting
  - duplicate order protection
  - spam detection
  - payment provider heuristics

See [docs/STOREFRONT_API_V3_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/STOREFRONT_API_V3_GUIDE.md) for the dedicated rule set.
For tracking and pixel behavior, also read [docs/CONVERSION_EVENT_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/CONVERSION_EVENT_GUIDE.md).

### 2. Internal backend logic is only for non-Scalev concerns

Cloudflare Pages Functions in this repo are used only for:

- `/admin-api`
  - admin login
  - admin session
  - storefront settings updates
- `/storefront-api/settings`
  - public storefront settings owned by this project
- HTML injection in [functions/[[path]].ts](/Users/armyalghifari/Documents/Github/storefront/functions/[[path]].ts)
  - inject public settings into initial HTML
  - inject the base Meta Pixel snippet when enabled

Cloudflare Functions are **not** used as a proxy for Storefront API v3.

## Responsibility Map

### Browser / Frontend

The frontend is responsible for:

- fetching catalog and product detail from Scalev
- managing the Scalev guest token in the browser
- managing cart state through Scalev
- creating checkout orders
- rendering payment selection
- redirecting to the Scalev payment page for redirect-based payment methods
- firing Meta browser events
- filtering hidden items using public storefront settings

Important files:

- [src/api/client.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/client.ts)
- [src/api/catalog.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/catalog.ts)
- [src/api/cart.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/cart.ts)
- [src/api/checkout.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/checkout.ts)
- [src/stores/analytics.ts](/Users/armyalghifari/Documents/Github/storefront/src/stores/analytics.ts)

### Cloudflare KV

KV is the source of truth for project-owned storefront settings:

- item visibility
- branding
- hero title/subtitle
- catalog section settings
- button and price colors
- allowed payment methods
- WhatsApp confirmation configuration
- Meta Ads configuration

Important files:

- [functions/_lib/settings.ts](/Users/armyalghifari/Documents/Github/storefront/functions/_lib/settings.ts)
- [functions/_lib/types.ts](/Users/armyalghifari/Documents/Github/storefront/functions/_lib/types.ts)

### Admin Panel

`/admin` manages:

- visible/hidden items
- store name
- hero copy
- UI colors
- allowed payment methods
- WhatsApp destination
- Meta Pixel settings

Important files:

- [src/views/AdminView.vue](/Users/armyalghifari/Documents/Github/storefront/src/views/AdminView.vue)
- [src/api/admin.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/admin.ts)
- [functions/admin-api/settings.ts](/Users/armyalghifari/Documents/Github/storefront/functions/admin-api/settings.ts)

## Important Data Flows

### Home / Catalog

1. The browser fetches public items from Scalev.
2. The browser fetches `/storefront-api/settings`.
3. Hidden item keys from settings are used to filter the catalog in the browser.
4. The UI renders only visible items.

Related files:

- [src/api/catalog.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/catalog.ts)
- [src/stores/storefrontSettings.ts](/Users/armyalghifari/Documents/Github/storefront/src/stores/storefrontSettings.ts)
- [src/utils/visibility.ts](/Users/armyalghifari/Documents/Github/storefront/src/utils/visibility.ts)

### Product Detail

1. The browser fetches product or bundle detail from Scalev.
2. The browser checks whether the item is hidden according to public settings.
3. If hidden, the frontend throws an error so the item does not render publicly.

### Cart

1. The browser calls Scalev v3 cart endpoints directly.
2. `x-scalev-guest-token` is stored in localStorage.
3. That guest token is reused for cart and checkout requests.

### Checkout

1. The browser collects customer or shipping data.
2. The browser fetches shipping summary directly from Scalev when needed.
3. The browser creates the order directly in Scalev.
4. After success:
   - purchase tracking runs
   - guest token/cart state is reset
   - if the payment method requires redirect, the browser is sent to `payment_url`
   - for manual transfer, the user stays on the internal order page

Important files:

- [src/views/CheckoutView.vue](/Users/armyalghifari/Documents/Github/storefront/src/views/CheckoutView.vue)
- [src/api/checkout.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/checkout.ts)
- [src/stores/cart.ts](/Users/armyalghifari/Documents/Github/storefront/src/stores/cart.ts)

### Order Page

1. The browser fetches public order detail from Scalev.
2. The frontend normalizes customer name/email/phone from the actual Scalev payload shape.
3. Payment instructions are rendered according to payment method:
   - `bank_transfer`: show bank accounts
   - redirect methods: show or use the official Scalev payment page

Important files:

- [src/views/OrderView.vue](/Users/armyalghifari/Documents/Github/storefront/src/views/OrderView.vue)
- [src/components/PaymentInstructions.vue](/Users/armyalghifari/Documents/Github/storefront/src/components/PaymentInstructions.vue)
- [src/utils/order.ts](/Users/armyalghifari/Documents/Github/storefront/src/utils/order.ts)

## Standardized Features

### Item Visibility

- visibility is no longer enforced by a v3 proxy layer
- visibility is stored in KV
- public settings expose `hiddenItemKeys`
- the frontend filters items

Benefits:

- remains consistent with the “do not proxy Storefront API v3” rule
- still supports per-store merchandising

### Payment Methods

- active payment methods are read from Scalev
- `/admin` can further restrict which methods should appear in the storefront
- checkout shows the intersection of:
  - methods active in Scalev
  - methods allowed in storefront settings

### Redirect Payment Flow

- redirect-based methods such as `invoice` or `qris` go to the official Scalev payment page after order creation
- bank transfer stays on the internal order page so bank instructions can be shown

### Meta Pixel

- the base snippet is injected into the initial HTML
- pixel settings come from public storefront settings
- follow-up events are triggered by runtime app logic

See [docs/CONVERSION_EVENT_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/CONVERSION_EVENT_GUIDE.md) for the detailed tracking rules.

## What Must Be Preserved When Duplicating This Pattern

- do not introduce a new proxy for Storefront API v3
- do not share one KV namespace across unrelated stores
- do not use one Pages project for multiple unrelated stores
- do not commit production secrets to Git
- do not deploy production manually from local

## Files Usually Touched For A New Store

- [wrangler.jsonc](/Users/armyalghifari/Documents/Github/storefront/wrangler.jsonc)
- Cloudflare env vars and secrets
- KV namespace binding
- `/admin` settings after the site is live

## Files Usually Not Changed For A New Store

- [src/api/client.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/client.ts)
- [src/api/catalog.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/catalog.ts)
- [src/api/cart.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/cart.ts)
- [src/api/checkout.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/checkout.ts)
- [functions/admin-api](/Users/armyalghifari/Documents/Github/storefront/functions/admin-api)
- [functions/storefront-api/settings.ts](/Users/armyalghifari/Documents/Github/storefront/functions/storefront-api/settings.ts)

In other words, for the next store the ideal changes are configuration and content, not the core architecture.
