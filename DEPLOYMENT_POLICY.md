# Deployment Policy

Production deployments for this storefront must use GitHub as the source of truth.

## Rules

1. All production changes must be committed to the repository first.
2. Production deploys must come from the native Cloudflare Pages GitHub integration on the `main` branch, not from a local machine.
3. Direct `wrangler pages deploy` production uploads are not part of the approved workflow.
4. If Cloudflare Pages and GitHub ever disagree, GitHub is the canonical source and Cloudflare must be updated from that state.

## Operational Guidance

- Open changes through Git, then push them to GitHub.
- Treat `main` on GitHub as the release branch for production.
- Use CI on GitHub to validate the build before production deployment reaches users.
- The active Cloudflare Pages project is connected natively to the GitHub repository `tenthdragon/storefront-esh`.
- A push to `main` is the production release mechanism.
- Local or CI-driven direct uploads should stay disabled unless the deployment model is intentionally redesigned.

## Local Guardrail

This repository intentionally blocks `npm run deploy` and `npm run deploy:production` so production deployment is not initiated from a local workstation.
