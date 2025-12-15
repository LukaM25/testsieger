import Link from "next/link";

export const metadata = {
  title: "Über uns – Prüfsiegel Zentrum UG",
  description: "Über das Deutsche Prüfsiegel Institut (DPI) und den Testsieger Check.",
};

export default function UeberUnsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <h1 className="text-3xl font-semibold text-slate-900">Über uns</h1>
      <p className="mt-4 text-slate-700 leading-relaxed">
        Das Deutsche Prüfsiegel Institut (DPI) unterstützt Unternehmen dabei, Produkte transparent und nachvollziehbar zu
        prüfen. Der Testsieger Check bündelt Kriterien, Dokumentation und Ergebnisbereitstellung in einem klaren Prozess.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/produkte" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black">
          Leistungen ansehen
        </Link>
        <Link href="/kontakt" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50">
          Kontakt
        </Link>
      </div>
    </main>
  );
}

