# Cloudflare Live Preview — CoFounderBay

## Quick Tunnel (τρέχει στο agent environment)

**Live URL:** https://vary-building-females-shaved.trycloudflare.com

- Landing: https://vary-building-females-shaved.trycloudflare.com/landing
- Login: https://vary-building-females-shaved.trycloudflare.com/login

> Προσωρινό Cloudflare Tunnel στο Expo static export. Λήγει όταν σταματήσει το VM/process.
> Το frontend καλεί API στο `localhost:8001` by default — χωρίς δημόσιο backend, auth/data calls θα αποτύχουν· το UI/routing φορτώνει κανονικά.

## Μόνιμο Cloudflare Pages

Απαιτεί secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

```bash
cd frontend
yarn export:web
cd ..
npx wrangler pages deploy frontend/dist --project-name cofounderbay-preview
```
