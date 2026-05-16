# Deployment Policy

Production deployments for this storefront must use GitHub as the source of truth.

## Rules

1. All production changes must be committed to the repository first.
2. Production deploys must come from the native Cloudflare Pages GitHub integration on the `main` branch, not from a local machine.
3. Direct `wrangler pages deploy` production uploads are not part of the approved workflow.
4. If Cloudflare Pages and GitHub ever disagree, GitHub is the canonical source and Cloudflare must be updated from that state.
5. Each Scalev store should have its own repository, Pages project, and KV namespace unless the architecture is intentionally redesigned into a multi-tenant platform.
6. Storefront API v3 must be called directly from the browser or end-user client. Do not route Storefront API v3 through local server proxies, middleware, edge functions, or backend pass-through layers.

## Operational Guidance

- Open changes through Git, then push them to GitHub.
- Treat `main` on GitHub as the release branch for production.
- Use CI on GitHub to validate the build before production deployment reaches users.
- The active Cloudflare Pages project for a given store should be connected natively to that store's GitHub repository.
- A push to `main` is the production release mechanism.
- Local or CI-driven direct uploads should stay disabled unless the deployment model is intentionally redesigned.
- Use Cloudflare only for this project's own admin/settings endpoints, not as a pass-through proxy for Storefront API v3.

## Local Guardrail

This repository intentionally blocks `npm run deploy` and `npm run deploy:production` so production deployment is not initiated from a local workstation.
