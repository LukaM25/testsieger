
# Testsieger Check – MVP

Next.js 14 + Prisma + Neon (Postgres) + Stripe + PDFMonkey + Tailwind

## 1) Prereqs
- Node 18+
- Stripe account (test mode), create 3 Prices (BASIC, PREMIUM subscriptions; LIFETIME one-time)
- PDFMonkey account + one template using Liquid variables: product.name, product.brand, user.name, user.email
- Neon DB (copy pooled connection string)

## 2) Configure env
Copy `.env.example` to `.env.local` and fill values.

**Neon note:** use the connection string with `sslmode=require`. Example:  
`postgresql://USER:PASS@ep-xxx.eu-west-1.aws.neon.tech/neondb?sslmode=require`

## 3) Install & migrate
```bash
npm install
npx prisma migrate dev --name init
```

## 4) Run
```bash
npm run dev
```
Open http://localhost:3000

Flow: Pre‑Check → Packages → Stripe checkout (test card `4242 4242 4242 4242`) → returns to Dashboard (status = PAID)

## 5) Stripe webhook (local)
```bash
stripe listen --forward-to localhost:3000/api/webhook
```
Put the signing secret into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

## 6) Mark review complete (admin)
```bash
curl -X POST   -H "Content-Type: application/json"   -H "x-admin-secret: $ADMIN_SECRET"   -d '{"productId":"<PRODUCT_ID>"}'   http://localhost:3000/api/admin/complete
```
Generates PDF via PDFMonkey, creates QR that links to `/verify/<PRODUCT_ID>`, stores both, and flips status to COMPLETED.

## 7) Deploy to Vercel
- Push repo to GitHub → import on Vercel
- Add env vars in Vercel Project Settings
- Stripe webhook: `https://<your-domain>/api/webhook`
- PDFMonkey template & API key
- `NEXT_PUBLIC_BASE_URL` to your domain
- Build command runs `prisma generate`; run `npx prisma migrate deploy` if using migrations

## Notes
- PDFMonkey `download_url` is short-lived; for production, proxy or store a copy.
- Admin route is protected by `x-admin-secret` (replace with real admin auth later).
