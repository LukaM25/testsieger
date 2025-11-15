
# Testsieger Check – MVP

Next.js 14 + Prisma + Neon (Postgres) + Stripe + PDFMonkey + Tailwind

## 1) Prereqs
- Node 18+
- Stripe account (test mode), create 3 Prices (BASIC, PREMIUM subscriptions; LIFETIME one-time)
- PDFMonkey account + one template using Liquid variables: product.name, product.brand, user.name, user.email
- Neon DB (copy pooled connection string)

## 2) Configure env

## 3) Install & migrate

## 4) Stripe webhook (local)

## 5) Mark review complete (admin)

Generates PDF via PDFMonkey, creates QR that links to `/verify/<PRODUCT_ID>`, stores both, and flips status to COMPLETED.

## 6) Deploy to Vercel
- Push repo to GitHub → import on Vercel
- Add env vars in Vercel Project Settings
- Stripe webhook: `https://<your-domain>/api/webhook`
- PDFMonkey template & API key
- `NEXT_PUBLIC_BASE_URL` to your domain
- Build command runs `prisma generate`; run `npx prisma migrate deploy` if using migrations

## Notes
- PDFMonkey `download_url` is short-lived; for production, proxy or store a copy.
- Admin route is protected by `x-admin-secret` (replace with real admin auth later).

## Development — 21st.dev toolbar

This project integrates the 21st.dev (21st-extension) developer toolbar in development to allow selecting UI elements in the browser and sending context to AI agents for code edits.

Quick notes:

- Packages installed (dev): `@21st-extension/toolbar-next` and `@21st-extension/react`. If you need to add them locally, run:

```bash
npm install --save-dev @21st-extension/toolbar-next @21st-extension/react
```

- Workspace VS Code extension recommendation is added at `.vscode/extensions.json` and recommends `21st.21st-extension`.

- How to use:
	1. Start the dev server: `npm run dev`.
	2. Open the app in your browser (default: `http://localhost:3000`).
	3. The toolbar is injected into the root layout during development and should appear once on initial page load. It runs client-side only and is not included in production builds.

- Where it's wired:
	- The toolbar component is injected in `app/layout.tsx` using a client-only dynamic import. If you want to change plugins or config, edit that file.

- Opt-out / customization:
	- The toolbar is enabled when `process.env.NODE_ENV === 'development'`. To opt out temporarily you can modify that guard in `app/layout.tsx` or set a custom environment flag and check it there.

If you'd like the integration refactored to a separate Next.js client component (ESM-only, lint-friendly) I can make that change next.
