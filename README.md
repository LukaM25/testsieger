# Testsieger Check / Prüfsiegel Zentrum UG

End-to-end Next.js 16 app for handling product pre-checks, payments, licensing, PDF/QR certificate generation, and customer verification. Built with Prisma/Postgres, Stripe Checkout, Nodemailer, Puppeteer-based PDFs, and Tailwind.

## Features
- Pre-check flow: creates user + product, generates a PDF invoice, sends confirmation, and tracks status until payment.
- Payments: Stripe Checkout for base fee (standard/priority) and for license plans (Basic/Premium subscriptions, Lifetime one-time).
- Customer portal: login/register, dashboard with products, orders, and certificate links; licensing overview at `/lizenzen`.
- Certificates & verification: generates report PDFs + QR codes, stores assets, emails customers; public verification via `/verify/:id|seal` and `/lizenzen?q=<certificateId>`.
- Admin console: role-based admins (SUPERADMIN full access) to list products, mark payment/status, upload reports, or trigger the internal certificate engine.
- PDFs & assets: Puppeteer template in `templates/certificate.hbs`, uploads saved to `public/uploads` and QR codes to `public/qr`.
- Tooling: Storybook, Vitest, Tailwind, 21st.dev toolbar in development.

## Stack
- Next.js 16 (App Router), React 18, TypeScript, Tailwind
- Prisma + Postgres (Neon-ready)
- Stripe Checkout
- Nodemailer SMTP
- Puppeteer/Chromium + Handlebars templates, `pdf-lib` for invoices, `qrcode` + `sharp` for seals
- Vitest + Testing Library; Storybook 10

## Project layout
- `app/` – routes (precheck, dashboard, verify, lizenzen, admin, marketing pages) and API routes (`api/precheck`, `api/payment`, `api/webhook`, `api/admin/*`, `api/certificates`, etc.)
- `lib/` – auth/session helpers, email, invoice PDF, completion pipeline, Prisma, stripe, seal generation
- `templates/` – Handlebars certificate template
- `public/` – static assets plus generated `uploads/` and `qr/`
- `prisma/` – schema and migrations
- `scripts/` – Playwright capture helpers, search index script
- `stories/` – Storybook examples
- `tests/` – Vitest sample

## Prerequisites
- Node.js 18+
- Postgres database (`DATABASE_URL`)
- Stripe account with 6 price IDs (base fees + 3 plans) and webhook secret
- SMTP credentials for transactional mail

## Environment variables (`.env.local`)
```
DATABASE_URL=
JWT_SECRET=

# Base URLs
APP_URL=https://your-domain.tld
NEXT_PUBLIC_BASE_URL=https://your-domain.tld
NEXT_PUBLIC_APP_URL=https://your-domain.tld   # used by emailService.js

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRECHECK_STANDARD=
STRIPE_PRICE_PRECHECK_PRIORITY=
STRIPE_PRICE_BASIC=
STRIPE_PRICE_PREMIUM=
STRIPE_PRICE_LIFETIME=

# SMTP
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=pruefsiegel@your-domain.tld

# Admin
ADMIN_JWT_SECRET=       # generate with: openssl rand -hex 32
ADMIN_DB_BYPASS=false   # optional: true to bypass DB read in admin list
```

## Setup
1. Install deps: `npm install`
2. Generate Prisma client: `npx prisma generate`
3. Run migrations: `npx prisma migrate dev --name init`
4. Seed a superadmin: `npm run seed:admin -- --email you@example.com --name "You" --password "StrongPass" --role SUPERADMIN`
5. Start dev server: `npm run dev` (http://localhost:3000)
6. (Optional) Storybook: `npm run storybook`
7. Tests: `npm test`

## Payment & webhook
- Base-fee checkout: `/api/precheck/pay` uses `STRIPE_PRICE_PRECHECK_STANDARD|PRIORITY`.
- License checkout: `/api/payment` uses `STRIPE_PRICE_BASIC|PREMIUM|LIFETIME`.
- Webhook: point Stripe to `/api/webhook` (e.g., `stripe listen --forward-to http://localhost:3000/api/webhook`). It marks orders paid and triggers completion.

## Certificates & emails
- Completion pipeline (`lib/completion.ts`, `app/api/certificates`) renders `templates/certificate.hbs` via Puppeteer, writes PDF/QR to `public/uploads` and `public/qr`, updates `Certificate`, and emails via `sendCompletionEmail`.
- Admin “upload” route can accept a PDF and generate QR/seal + email.
- emailService-based engine (`emailService.js` / `pdfGenerator.js`) is available for the admin “complete” endpoint.
- If SMTP is not configured, mails are skipped with a console warning.

## Admin usage
- Login at `/admin` with your admin email/password (seeded via `npm run seed:admin`). Only `SUPERADMIN` currently has full access.
- Actions include: list products, set payment/status, receive goods, upload report to create certificate, trigger internal certificate engine, or mark completion manually.
- Admin routes require the admin session cookie (`admin_token`) signed with `ADMIN_JWT_SECRET`.

## Deployment notes
- Vercel-ready; ensure `postinstall` runs `prisma generate`.
- Configure all env vars in the hosting platform.
- Public asset generation currently writes to `public/uploads` and `public/qr`; swap to S3 if you need durable storage/CDN.
- Set webhook URL to `https://<your-domain>/api/webhook`.

## Troubleshooting
- Missing SMTP vars → emails skipped.
- Missing Stripe price IDs/webhook secret → checkout/webhook fails.
- Puppeteer on Vercel uses `@sparticuz/chromium`; local uses full `puppeteer`.
- `ADMIN_DB_BYPASS=true` lets the admin product list render even if the DB is unreachable (returns empty list with a warning).
