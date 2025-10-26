
export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(184,134,11,0.15),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(0,0,0,0.08),transparent_50%)]" />
      <div className="relative px-6 py-16 md:px-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 text-xs font-medium rounded-full border px-3 py-1 bg-white/70 backdrop-blur">
            <img src="/hero-badge.svg" className="h-4" alt="Badge" />
            Testsieger Check · Prüfsiegel Zentrum UG
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Ihr Produkt verdient <span className="text-[color:var(--brand)]">Vertrauen</span>.
          </h1>
          <p className="text-neutral-700 text-lg leading-relaxed">
            Unabhängige Prüfung, offizieller Prüfbericht und digitales Zertifikat.
            Steigern Sie Conversion & Sichtbarkeit mit dem Testsieger‑Siegel.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="/precheck" className="btn btn-primary w-full sm:w-auto">Jetzt Pre‑Check starten</a>
            <a href="#ablauf" className="btn w-full sm:w-auto border">Ablauf ansehen</a>
          </div>
          <div className="flex items-center gap-6 text-sm text-neutral-600 pt-2">
            <div>🇩🇪 🇪🇺 Berichte in DE & EU‑Sprachen</div>
            <div>✔️ QR‑Verifikation</div>
            <div>🔒 DSGVO‑konform</div>
          </div>
        </div>
        <div className="relative">
          <div className="rounded-2xl border shadow-sm bg-white p-6">
            <div className="h-56 md:h-72 w-full grid place-items-center text-center">
              <div>
                <div className="text-xl font-semibold">Zertifikat‑Vorschau</div>
                <div className="text-sm text-neutral-600">(PDF wird automatisch generiert)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
