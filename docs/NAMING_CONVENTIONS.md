# Naming Conventions

This document explains what “repository naming convention” means for this headless storefront pattern.

The goal is simple:

- all resources use a consistent naming scheme
- an LLM or human operator can infer the relationship between resources quickly
- there are no naming collisions when you have many stores

## Basic Principle

Choose one stable `store_slug` for each store.

Rules:

- all lowercase
- use `kebab-case`
- avoid spaces
- avoid unstable names such as `final`, `new`, or `test2`
- avoid short-lived campaign names

## Recommended Naming Pattern

If `store_slug = army-alghifari`, use:

| Resource | Format | Example |
| --- | --- | --- |
| GitHub repository | `storefront-{store_slug}` | `storefront-army-alghifari` |
| Cloudflare Pages project | `storefront-{store_slug}` | `storefront-army-alghifari` |
| KV namespace | `{store_slug}-storefront-settings` | `army-alghifari-storefront-settings` |
| Production branch | `main` | `main` |
| Admin URL | `/admin` | `/admin` |
| Pages subdomain | `{pages_project}.pages.dev` | `storefront-army-alghifari.pages.dev` |

## If One Business Has Many Stores

Use slugs that remain unique, for example:

- `roove-meta-ads`
- `roove-cavac-model`
- `army-alghifari`
- `army-digital-class`

Then the resources follow naturally:

- `storefront-roove-meta-ads`
- `storefront-roove-cavac-model`
- `storefront-army-alghifari`

## Why Repository and Pages Project Names Should Match

If the repository and Pages project use the same name, operations become easier:

- easier to find in GitHub
- easier to match in Cloudflare
- simpler runbooks for LLMs
- lower risk of deploying to the wrong project

## Anti-Patterns

Avoid names such as:

- `storefront-final`
- `storefront-super-new`
- `army storefront`
- `StoreFrontArmy`
- one repository used for multiple unrelated stores

## Practical Recommendation

If you are unsure, use this pattern:

- repository: `storefront-{store_slug}`
- Pages project: `storefront-{store_slug}`
- KV namespace: `{store_slug}-storefront-settings`

That is already clean, easy to audit, and friendly for both LLMs and human operators.
