# Conversion Event Guide

This document defines the conversion event best practices for this headless storefront pattern when using Scalev Storefront API v3 and Meta Pixel.

Its purpose is to prevent another LLM or developer from inventing a tracking architecture that conflicts with the intended design of this repository.

## Hard Rules

### 1. Do not proxy Storefront API v3 conversion endpoints

Analytics / conversion endpoints from Scalev Storefront API v3 must be called directly from the browser, just like the other v3 endpoints.

Do not send conversion endpoints through:

- your own backend
- a reverse proxy
- middleware
- an edge function
- a Cloudflare Worker / Pages Function
- a serverless pass-through API

Reasons:

- Storefront API v3 is designed for direct browser usage
- rate limiting is intentionally strict
- proxying can make many users appear to come from the same IP
- spam detection, duplicate protection, and attribution can be distorted

## Tracking Model Used In This Repo

Tracking is split into two layers:

1. **Base pixel bootstrap**
2. **Runtime event firing**

### Base pixel bootstrap

The base pixel must be available very early in the initial storefront HTML.

In this repo, the base snippet is injected by:

- [functions/[[path]].ts](/Users/armyalghifari/Documents/Github/storefront/functions/[[path]].ts)

What it does:

- inject public storefront settings into the HTML
- inject the base Meta Pixel snippet when Meta tracking is enabled
- fire the base `PageView` from the initial snippet

This matters because helpers such as Meta Pixel Helper often fail to detect the pixel when bootstrap happens too late or only after an async frontend fetch completes.

### Runtime event firing

Post-load events are handled by the frontend application.

Main file:

- [src/stores/analytics.ts](/Users/armyalghifari/Documents/Github/storefront/src/stores/analytics.ts)

The frontend is responsible for:

- `ViewContent`
- `AddToCart`
- `InitiateCheckout`
- `Purchase`

## Required Event Sequence

### 1. `PageView`

`PageView` is the baseline event.

Rules:

- the base snippet must be ready first
- the first storefront page must produce `PageView`
- later route changes may also need runtime page-view handling

### 2. `ViewContent`

Fire this when a product detail or bundle detail page has loaded successfully and the active item is known.

In this repo:

- product detail → `trackMetaViewContentForProduct(...)`
- bundle detail → `trackMetaViewContentForBundle(...)`

### 3. `AddToCart`

Fire this when the user truly adds an item to the cart.

Rules:

- the browser event may fire immediately from the active product context
- the Scalev relay must still correspond to the correct item payload
- do not depend on fragile cart lookups if the active item context is already available in the page

### 4. `InitiateCheckout`

Fire this when the user truly enters checkout with a real cart context.

In this repo, the event is fired from the cart context when checkout begins.

### 5. `Purchase`

`Purchase` must follow the configured trigger:

- `checkout_success`
- `order_paid`

Do not fire both for the same purchase flow.

## Dedupe Rule

The browser event and the server relay for the same action must use the same `event_id`.

This is especially important for:

- `AddToCart`
- `InitiateCheckout`
- `Purchase`

In this repo, event IDs are managed in the analytics store so that:

- browser events remain visible to helper tools
- the Scalev relay can still be sent
- Meta can deduplicate correctly

## Browser vs Server Responsibilities

### Browser

The browser must handle:

- base snippet availability
- firing Meta browser events
- storing relevant attribution data
- sending relay events directly to Scalev v3 endpoints

### Server / Cloudflare

The Cloudflare layer in this repo is **not** used to proxy Scalev v3 conversion endpoints.

Cloudflare is only used for:

- admin auth/settings
- public storefront settings
- base HTML injection

## What Another LLM Must Not Do

Another LLM must not:

- move Scalev v3 analytics endpoints into an internal proxy
- move checkout into an internal proxy
- invent new event firing points without a clear lifecycle reason
- fire `Purchase` from multiple places at once
- change the base pixel bootstrap into a late async-only fetch pattern without a strong reason
- conclude that “the pixel is broken” before checking bootstrap timing and helper environment behavior

## Verification Checklist

When changing tracking, verify at least:

1. the pixel is detected on the storefront page
2. `PageView` appears
3. `ViewContent` appears on product detail
4. `AddToCart` appears when an item is added
5. `InitiateCheckout` appears when checkout begins
6. `Purchase` appears only on the configured trigger
7. analytics v3 endpoints are still called directly from the browser
8. no internal proxy has been added for Storefront API v3 endpoints

## Repo-Specific Rule

If another store is duplicated from this repo, keep these rules intact:

- Storefront API v3 remains browser-direct
- conversion endpoints remain browser-direct
- the base snippet remains injected into the initial HTML
- runtime event logic remains centralized in [src/stores/analytics.ts](/Users/armyalghifari/Documents/Github/storefront/src/stores/analytics.ts)
- `/admin` only manages settings and must not become a relay for Scalev v3 conversion endpoints
