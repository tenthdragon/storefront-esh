# Scalev Headless Storefront Starter

This repository is a starter for building one headless storefront per Scalev store.

The recommended operating model is not one app for many stores. Instead, use:

1. `1 Scalev store`
2. `1 GitHub repository`
3. `1 Cloudflare Pages project`
4. `1 KV namespace for settings`
5. `1 /admin` panel to manage branding, hero content, theme, payment preferences, and item visibility for that store

This keeps each store isolated, easy to rebrand, and safe to deploy through GitHub without affecting other stores.

## Features

- Catalog, product detail, cart, checkout, and order views
- Admin panel at `/admin`
- Per-store product and bundle visibility
- Store name, hero title, hero subtitle, and catalog section title settings
- Theme button color and price text color settings
- Catalog filtering through public settings + KV
- Production deploys only through GitHub + native Cloudflare Pages Git integration

## Core Architecture

- Frontend: Vue 3 + Vite
- Routing: Vue Router
- State: Pinia
- Public API: Scalev Storefront API v3, called directly from the browser
- Edge layer: Cloudflare Pages Functions
- Admin settings storage: Cloudflare KV (`STOREFRONT_SETTINGS`)
- Production deploy: push to `main`

## Important Files

- [src/api/client.ts](/Users/armyalghifari/Documents/Github/storefront/src/api/client.ts): Scalev storefront API client
- [functions/admin-api](/Users/armyalghifari/Documents/Github/storefront/functions/admin-api): admin auth and settings API
- [functions/storefront-api/settings.ts](/Users/armyalghifari/Documents/Github/storefront/functions/storefront-api/settings.ts): public settings endpoint
- [functions/_lib/settings.ts](/Users/armyalghifari/Documents/Github/storefront/functions/_lib/settings.ts): default settings, normalization, KV load/save
- [wrangler.jsonc](/Users/armyalghifari/Documents/Github/storefront/wrangler.jsonc): Cloudflare project bindings
- [DEPLOYMENT_POLICY.md](/Users/armyalghifari/Documents/Github/storefront/DEPLOYMENT_POLICY.md): production deployment rules

## Replication Model

For a new store, duplicate this repository as a starter.

Do not use one repository for many unrelated stores unless you are intentionally redesigning it into a multi-tenant platform.

Recommended flow:

1. Create a new repository from this starter.
2. Connect the new repository to a new Pages project.
3. Create a new KV namespace.
4. Fill in the new store env vars and secrets.
5. Push to `main`.
6. Finish storefront merchandising through `/admin`.

## Quick Start

1. Copy [`.env.example`](/Users/armyalghifari/Documents/Github/storefront/.env.example) to `.env` for local development.
2. Fill in:
   - `VITE_SCALEV_STORE_UNIQUE_ID`
   - `VITE_SCALEV_STOREFRONT_API_KEY`
3. Run `npm install`
4. If this repository is a duplicate for a new store, run:

```bash
npm run bootstrap:store -- --store-slug army-alghifari --kv-id your_kv_namespace_id
```

5. Run `npm run dev`
6. When ready for production, create a new Pages project with GitHub integration.
7. Add env vars, secrets, and the KV binding in Cloudflare.
8. Push to `main` for production deployment.

## Bootstrap a New Store

This command exists so a duplicated repo can be moved to a new store identity without manually editing `wrangler.jsonc`.

Example:

```bash
npm run bootstrap:store -- --store-slug army-alghifari --kv-id 1234567890abcdef1234567890abcdef
```

Available flags:

- `--store-slug` required, must be `kebab-case`
- `--pages-project` optional, defaults to `storefront-{store_slug}`
- `--kv-id` optional, defaults to the placeholder `your_kv_namespace_id`
- `--compatibility-date` optional, defaults to the current value in the repo

Changed file:

- [wrangler.jsonc](/Users/armyalghifari/Documents/Github/storefront/wrangler.jsonc)

## Naming Convention

Naming convention means all store resources follow a predictable pattern.

For a store with slug `army-alghifari`:

- GitHub repo: `storefront-army-alghifari`
- Cloudflare Pages project: `storefront-army-alghifari`
- KV namespace: `army-alghifari-storefront-settings`
- Admin URL: `/admin`

See the full guide in [docs/NAMING_CONVENTIONS.md](/Users/armyalghifari/Documents/Github/storefront/docs/NAMING_CONVENTIONS.md).

## Operational Documents

- [docs/CONVERSION_EVENT_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/CONVERSION_EVENT_GUIDE.md)
- [docs/IMPLEMENTATION_BLUEPRINT.md](/Users/armyalghifari/Documents/Github/storefront/docs/IMPLEMENTATION_BLUEPRINT.md)
- [docs/LLM_STORE_LAUNCH_RUNBOOK.md](/Users/armyalghifari/Documents/Github/storefront/docs/LLM_STORE_LAUNCH_RUNBOOK.md)
- [docs/NAMING_CONVENTIONS.md](/Users/armyalghifari/Documents/Github/storefront/docs/NAMING_CONVENTIONS.md)
- [docs/STORE_DUPLICATION_CHECKLIST.md](/Users/armyalghifari/Documents/Github/storefront/docs/STORE_DUPLICATION_CHECKLIST.md)
- [docs/STORE_CONFIG_TEMPLATE.md](/Users/armyalghifari/Documents/Github/storefront/docs/STORE_CONFIG_TEMPLATE.md)
- [docs/STOREFRONT_API_V3_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/STOREFRONT_API_V3_GUIDE.md)

## Important Notes

- Do not commit production env files that contain store-specific IDs or API keys.
- Store production env vars and secrets in Cloudflare Pages, not in Git.
- Use one KV namespace per store.
- `npm run deploy` is intentionally blocked. Production releases must go through GitHub to `main`.
- After duplicating the repository for a new store, run `npm run bootstrap:store` before configuring Cloudflare.
- Never proxy Storefront API v3 through your own backend or edge layer. See [docs/STOREFRONT_API_V3_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/STOREFRONT_API_V3_GUIDE.md).

## Handoff Prompt for Another LLM

If a new storefront will be launched by another LLM, this is a safe starting prompt:

> Use [docs/IMPLEMENTATION_BLUEPRINT.md](/Users/armyalghifari/Documents/Github/storefront/docs/IMPLEMENTATION_BLUEPRINT.md), [docs/CONVERSION_EVENT_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/CONVERSION_EVENT_GUIDE.md), [docs/LLM_STORE_LAUNCH_RUNBOOK.md](/Users/armyalghifari/Documents/Github/storefront/docs/LLM_STORE_LAUNCH_RUNBOOK.md), [docs/STORE_DUPLICATION_CHECKLIST.md](/Users/armyalghifari/Documents/Github/storefront/docs/STORE_DUPLICATION_CHECKLIST.md), and [docs/STORE_CONFIG_TEMPLATE.md](/Users/armyalghifari/Documents/Github/storefront/docs/STORE_CONFIG_TEMPLATE.md). Help me launch a new storefront from this starter all the way to Cloudflare Pages production. Do not deploy manually from local. Use GitHub as the source of truth. Only ask for inputs that are truly missing, then complete the rest end-to-end.
