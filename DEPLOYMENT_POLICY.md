# Deployment Policy

Production deployments for this storefront must use GitHub as the source of truth.

## Rules

1. All production changes must be committed to the repository first.
2. Production deploys must be triggered from the GitHub-backed deployment flow, not from a local machine.
3. Direct `wrangler pages deploy` production uploads are not part of the approved workflow.
4. If Cloudflare Pages and GitHub ever disagree, GitHub is the canonical source and Cloudflare must be updated from that state.

## Operational Guidance

- Open changes through Git, then push them to GitHub.
- Treat `main` on GitHub as the release branch for production.
- Use CI on GitHub to validate the build before or alongside production deployment.
- This repository includes a GitHub Actions deployment workflow for the current Cloudflare Pages project.
- This Cloudflare Pages project was created as a Direct Upload project. Cloudflare does not let a Direct Upload Pages project switch to Git integration later, so the practical GitHub-only path for this project is GitHub Actions plus a team rule to stop manual uploads.

## Local Guardrail

This repository intentionally blocks `npm run deploy` and `npm run deploy:production` so production deployment is not initiated from a local workstation.
