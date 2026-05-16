# Storefront API v3 Guide

Storefront API v3 is designed to be called directly from the browser or end-user client.

## Hard Rule

Do not proxy Storefront API v3 through your own backend, middleware, reverse proxy, edge function, serverless function, or Cloudflare Worker/Pages Function.

This applies to all Storefront API v3 endpoints such as:

- catalog and product endpoints
- cart endpoints
- checkout endpoints
- payment methods
- order detail endpoints
- analytics/conversion endpoints

## Why

Storefront API v3 rate limiting is intentionally strict because the API is designed for direct browser usage.

If you proxy these requests:

- many users may appear to come from the same server IP
- rate limiting can become inaccurate or too aggressive
- duplicate-order protection and spam detection can behave incorrectly
- provider-side IP-based heuristics may treat unrelated customers as the same source

## Recommended Architecture

- Browser or end-user client calls Scalev Storefront API v3 directly.
- Your own app may still use separate custom endpoints for non-Scalev concerns such as:
  - admin authentication
  - storefront settings
  - merchandising rules
  - visibility preferences

## Pattern Used In This Repo

- Scalev Storefront API v3 calls go direct from the browser to `https://api.scalev.com`.
- `/admin-api` is only for admin auth and settings.
- `/storefront-api/settings` is only for public storefront settings owned by this project.
- Hidden products are filtered in the frontend using public storefront settings, not by proxying Scalev v3.

## Migration Note

If an older implementation still uses `/scalev-api` or another internal proxy path for Storefront API v3, remove that indirection first before debugging rate limiting, duplicate orders, or client IP issues.
