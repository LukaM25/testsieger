
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
