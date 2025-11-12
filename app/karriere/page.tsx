const roles = [
  {
    title: "Prüfingenieur:in",
    description: "Führe eigenständig Verifizierungen durch, dokumentiere Testergebnisse lückenlos und bringe neue Prüfabläufe mit einem Auge für Details ein.",
  },
  {
    title: "Service & Kundenportal",
    description: "Berate Partner:innen, gib Orientierung im Zugang zur Plattform und sorge für transparente Kommunikation rund um Audit-Anfragen.",
  },
];

export default function KarrierePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-lg">
          <p className="text-sm font-semibold text-[#0a74da]">Karriere</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight">Vertrauensebene schaffen – mit deinem Know-how.</h1>
          <p className="mt-4 text-lg text-slate-600">
            Als Prüfsiegel-Zentrum halten wir Prozesse transparent, messbar und menschlich. Wir suchen Kolleg:innen, die mit neugierigem Geist unsere Prüfverfahren mitgestalten und Kund:innen echte Sicherheit geben.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {roles.map((role) => (
              <article key={role.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900">{role.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{role.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <h2 className="text-2xl font-semibold">Warum mit uns prüfen?</h2>
          <ul className="mt-4 space-y-3 text-slate-600">
            <li>• echte Verantwortung für Qualität und Unternehmenskultur</li>
            <li>• moderne Prüfprozesse, gestaltet für digitale Services</li>
            <li>• Raum für Weiterbildung und eigene Ideen beim Servicescape-Aufbau</li>
          </ul>
          <p className="mt-4 text-sm text-slate-500">
            Schicke deine Unterlagen an <a href="mailto:jobs@pruefsiegel-zentrum.de" className="font-semibold text-[#0a74da]">jobs@pruefsiegel-zentrum.de</a> oder nutze das Kontaktformular. Wir melden uns innerhalb einer Woche mit einem klaren nächsten Schritt.
          </p>
        </div>
      </section>
    </main>
  );
}
