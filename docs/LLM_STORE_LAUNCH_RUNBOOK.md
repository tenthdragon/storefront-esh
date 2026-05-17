# LLM Store Launch Runbook

This runbook exists so another LLM can help a user launch a new storefront from scratch using the same architecture as this repository.

Before following the operational steps, also read:

- [docs/CONVERSION_EVENT_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/CONVERSION_EVENT_GUIDE.md)
- [docs/IMPLEMENTATION_BLUEPRINT.md](/Users/armyalghifari/Documents/Github/storefront/docs/IMPLEMENTATION_BLUEPRINT.md)
- [docs/STOREFRONT_API_V3_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/STOREFRONT_API_V3_GUIDE.md)
- [docs/STORE_DUPLICATION_CHECKLIST.md](/Users/armyalghifari/Documents/Github/storefront/docs/STORE_DUPLICATION_CHECKLIST.md)

## Operating Model

Assume the following model:

1. one Scalev store = one repository
2. one Scalev store = one Cloudflare Pages project
3. one Scalev store = one KV namespace
4. production deploys only through GitHub integration to the `main` branch
5. Storefront API v3 is called directly from the browser, not proxied through backend or edge layers

Do not combine unrelated stores into one repository unless there is an explicit decision to build a multi-tenant platform.

## Required Inputs

Before starting, the LLM should make sure the following data exists:

- store name
- store slug
- GitHub owner
- repository name
- Cloudflare account to use
- `VITE_SCALEV_STORE_UNIQUE_ID`
- `VITE_SCALEV_STOREFRONT_API_KEY`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- custom domain, if any

If some names have not been chosen yet, suggest defaults based on [docs/NAMING_CONVENTIONS.md](/Users/armyalghifari/Documents/Github/storefront/docs/NAMING_CONVENTIONS.md).

## Step 1: Define Consistent Naming

Derive all resource names from a single `store_slug`.

Recommended defaults:

- repository: `storefront-{store_slug}`
- Pages project: `storefront-{store_slug}`
- KV namespace: `{store_slug}-storefront-settings`

## Step 2: Create the New Repository

The LLM should:

1. create a new repository from this starter or duplicate the current working tree into a new repo
2. make sure `origin` points to the new store repository
3. keep the production branch as `main`

## Step 3: Prepare Local Configuration

The LLM should:

1. run the store bootstrap command:

```bash
npm run bootstrap:store -- --store-slug <store-slug> --kv-id <kv-namespace-id>
```

2. copy `.env.example` to `.env`
3. fill in:
   - `VITE_SCALEV_STORE_UNIQUE_ID`
   - `VITE_SCALEV_STOREFRONT_API_KEY`
4. run `npm install`
5. run `npm run build`
6. run `npm run dev` when local verification is needed

## Step 4: Create Cloudflare Resources

The LLM should help the user create:

1. a new Pages project with GitHub integration
2. a new KV namespace

Pages setup:

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`

Required bindings and secrets:

- KV binding: `STOREFRONT_SETTINGS`
- env var: `VITE_SCALEV_STORE_UNIQUE_ID`
- env var: `VITE_SCALEV_STOREFRONT_API_KEY`
- secret: `ADMIN_PASSWORD`
- secret: `ADMIN_SESSION_SECRET`

Notes:

- env vars must be filled for production
- if preview deployments are used, fill preview env vars too
- do not store production secrets in Git
- if the KV namespace does not exist yet during bootstrap, a placeholder may be used first and `wrangler.jsonc` can be updated later

## Step 5: Align GitHub and Cloudflare

After the Pages project is created, the LLM should confirm:

- the correct GitHub repository is connected
- the production branch is `main`
- deployment comes from GitHub, not from local direct uploads

See [DEPLOYMENT_POLICY.md](/Users/armyalghifari/Documents/Github/storefront/DEPLOYMENT_POLICY.md) when needed.

## Step 6: First Launch

The LLM should:

1. commit the setup changes that belong in the repository
2. push to `main`
3. wait for the Cloudflare deployment to finish
4. verify the production URL

## Step 7: Post-Deploy Verification

The LLM should verify:

- homepage `/` returns `200`
- `/admin` is reachable
- admin login works
- the catalog loads products
- item visibility changes are saved
- `/storefront-api/settings` returns `200`
- the live Cloudflare assets match the latest deployed commit

## Step 8: Initial Merchandising

After launch, the LLM can help the user set:

- navbar store name
- hero title
- hero subtitle
- catalog section title
- button color
- price text color
- visible / hidden items

## Common Failure Cases

### 1. Storefront returns `404`

Usually caused by:

- wrong `VITE_SCALEV_STORE_UNIQUE_ID`
- wrong `VITE_SCALEV_STOREFRONT_API_KEY`
- production env vars missing in Cloudflare

### 2. `/admin` cannot log in

Usually caused by:

- `ADMIN_PASSWORD` not set
- `ADMIN_SESSION_SECRET` not set

### 3. Settings do not save

Usually caused by:

- `STOREFRONT_SETTINGS` not bound to KV

### 4. GitHub and Cloudflare are out of sync

Usually caused by:

- deployment not finished yet
- wrong repository connected to Pages
- production branch not set to `main`

## Guardrails

The LLM must not:

- deploy production directly from local
- commit production secrets to Git
- reuse one KV namespace across unrelated stores
- reuse one repository across stores in different Cloudflare accounts without checking platform constraints
- create an internal proxy for Storefront API v3

## Recommended Handoff Prompt

If the user wants another LLM to handle the launch, use this prompt:

> Use this repository as a one-store starter. Follow [docs/IMPLEMENTATION_BLUEPRINT.md](/Users/armyalghifari/Documents/Github/storefront/docs/IMPLEMENTATION_BLUEPRINT.md), [docs/CONVERSION_EVENT_GUIDE.md](/Users/armyalghifari/Documents/Github/storefront/docs/CONVERSION_EVENT_GUIDE.md), [docs/LLM_STORE_LAUNCH_RUNBOOK.md](/Users/armyalghifari/Documents/Github/storefront/docs/LLM_STORE_LAUNCH_RUNBOOK.md), [docs/STORE_DUPLICATION_CHECKLIST.md](/Users/armyalghifari/Documents/Github/storefront/docs/STORE_DUPLICATION_CHECKLIST.md), and [docs/STORE_CONFIG_TEMPLATE.md](/Users/armyalghifari/Documents/Github/storefront/docs/STORE_CONFIG_TEMPLATE.md). Help me launch a new storefront all the way to Cloudflare Pages production. Use GitHub as the source of truth and do not deploy manually from local.
