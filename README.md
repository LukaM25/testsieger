
# Testsieger Check – MVP

Next.js 14 + Prisma + Neon (Postgres) + Stripe + PDFMonkey + Tailwind

## 1) Prereqs
- Node 18+
- Stripe account (test mode), create 3 Prices (BASIC, PREMIUM subscriptions; LIFETIME one-time)
- PDFMonkey account + one template that works with the payload described below
- Neon DB (copy pooled connection string)

## 2) Configure env

## 3) Install & migrate

## 4) Stripe webhook (local)

## 5) Mark review complete (admin)

Generates PDF via PDFMonkey, creates QR that links to `/testergebnisse?productId=<PRODUCT_ID>`, stores both, and flips status to COMPLETED.

## PDFMonkey template expectations

`lib/completion.ts` now sends a structured payload that mirrors the Pre-Check fields:

```json
{
  "product": {
    "id": "...",
    "name": "...",
    "brand": "...",
    "code": "...",
    "specs": "...",
    "size": "...",
    "made_in": "...",
    "material": "..."
  },
  "user": {
    "name": "...",
    "company": "...",
    "email": "...",
    "address": "..."
  },
  "standard": "Prüfsiegel Zentrum UG Standard 2025",
  "date": "YYYY-MM-DD",
  "seal_number": "...",
  "verify_url": "...",
  "qr_data": "data:image/png;base64,..."
}
```

Use Liquid lookups such as `{{ product.name }}`, `{{ user.company }}`, `{{ verify_url }}` and embed the QR with `<img src="{{ qr_data }}" alt="QR-Code" />`. The standard/date/seal fields are provided for your layout, and you can expand the payload here if your template requires additional variables.

The `/testergebnisse` page now respects a `productId` query parameter: if a certificate exists for that product it renders a verification card with the Siegelnummer, links to the PDF, and the option to dive deeper via `/verify/{seal_number}`. Point the QR (and `verify_url`) to `{{ verify_url }}` from the payload so the scanned QR automatically loads the customer-specific block.

### Suggested PDFMonkey template structure

Here’s a basic Liquid + HTML scaffold that matches the payload and includes the QR:

```liquid
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: 'Inter', system-ui, sans-serif; color: #111; padding: 40px; }
      .badge { display: inline-flex; padding: 4px 12px; border-radius: 999px; background: #111; color: white; font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase; }
      .grid { display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
      .card { border: 1px solid #e5e7eb; border-radius: 24px; padding: 24px; }
      .qr { width: 150px; height: 150px; object-fit: contain; }
    </style>
  </head>
  <body>
    <span class="badge">Prüfsiegel Zentrum UG</span>
    <h1>{{ product.name }}</h1>
    <p class="lead">
      Marke: <strong>{{ product.brand }}</strong><br />
      Kodex: {{ product.code }} • Material: {{ product.material }} • Maße: {{ product.size }}
    </p>
    <div class="grid">
      <div class="card">
        <h2>Kunde</h2>
        <p><strong>{{ user.name }}</strong><br />{{ user.company }}<br />{{ user.address }}<br /><a href="mailto:{{ user.email }}">{{ user.email }}</a></p>
      </div>
      <div class="card">
        <h2>Prüfstandards</h2>
        <p>{{ standard }}</p>
        <p><strong>Siegelnummer:</strong> {{ seal_number }}</p>
        <p><strong>Datum:</strong> {{ date }}</p>
        <p><strong>Produkt-ID:</strong> {{ product.id }}</p>
      </div>
      <div class="card">
        <h2>QR-Code</h2>
        <img class="qr" src="{{ qr_data }}" alt="QR-Code zur Verifikation" />
        <p><a href="{{ verify_url }}">{{ verify_url }}</a></p>
      </div>
    </div>
    <footer style="margin-top: 40px; font-size: 0.8rem; color: #475569;">
      <p>Prüfergebnis: {{ product.specs }}</p>
    </footer>
  </body>
</html>
```

### qr_data handling

`lib/completion.ts` already generates a base64 `qr_data` image from the customer’s `verify_url`. When scanned, that QR currently points to `<your-domain>/testergebnisse?productId=<PRODUCT_ID>` so the customer is taken straight to the testergebnisse overview with the `productId` query filled. Make sure your PDFMonkey template renders it exactly as shown above (`<img src="{{ qr_data }}" ... />`); no further QR support is needed on their side.

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
