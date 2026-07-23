# quilsolWEBSITE

Quicksol Global corporate website built with Next.js, TypeScript, Tailwind CSS, next-intl and Framer Motion.

The platform now includes Supabase-ready B2B catalog routes, protected portal/admin shells, cart/RFQ routes, an AI catalog endpoint with server-only OpenAI access, and SQL migrations for catalog, RLS and storage setup.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000/en` or `http://localhost:3000/es`.

Key routes:

- `/en/catalog`
- `/en/products/[slug]`
- `/en/contact`
- `/en/rfq`
- `/en/portal`
- `/en/admin`
- `/en/cart`
- `/en/favorites`
- `/en/quotes`
- `/en/orders`

## Notes

- Localized routes are under `/en`, `/es`, `/zh`, `/fr`, `/de`, `/ja` and `/ko`.
- Editable copy lives in `src/messages`.
- Brand assets live in `public/logos` and `public/images`.
- Supabase migration lives in `supabase/migrations/202607160001_b2b_catalog_platform.sql`.
- External credentials are configured through Render environment variables, never committed.

## Render

This repository includes `render.yaml` so Render deploys it as a Node web
service instead of auto-detecting another runtime.

- Runtime: Node
- Build command: `npm ci && npm run build`
- Start command: `npm run start`
- Health check: `/en`
