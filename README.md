# CoFounderBay

Specialized social network for the startup ecosystem (founders, investors, mentors, talent).

## Docs
- Full project audit: [`docs/AUDIT_REPORT.md`](docs/AUDIT_REPORT.md)
- Cloudflare live preview: [`docs/PREVIEW.md`](docs/PREVIEW.md)

## Stack
- **Frontend:** Expo 54 / React Native / Expo Router (web static export)
- **Backend:** FastAPI + MongoDB (`backend/server.py`)

## Quick start
```bash
# Frontend
cd frontend && yarn && yarn web

# Backend (requires MONGO_URL)
cd backend && pip install -r requirements.txt && uvicorn server:app --reload --port 8001
```

## Cloudflare Pages
```bash
cd frontend && yarn export:web
npx wrangler pages deploy dist --project-name cofounderbay-preview
```
