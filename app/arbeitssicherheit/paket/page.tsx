import Link from "next/link";
import type { Metadata } from "next";
import { assertArbeitssicherheitAccess } from "@/lib/arbeitssicherheit/gate";
import AsPackageWizard from "@/components/home/AsPackageWizard";
import { type PkgKey } from "@/lib/arbeitssicherheit/pricing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Paket anpassen | Arbeitssicherheit", robots: { index: false, follow: false } };

export default async function PaketPage({ searchParams }: { searchParams?: Promise<{ p?: string }> }) {
  assertArbeitssicherheitAccess();
  const sp = await searchParams;
  const initial: PkgKey | null = sp?.p === "betreuung" ? "betreuung" : sp?.p === "start" ? "start" : sp?.p === "enterprise" ? "enterprise" : null;

  return (
    <main className="bg-gradient-to-b from-slate-50 via-white to-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <Link href="/arbeitssicherheit#pakete" className="text-sm font-semibold text-[#1d4ed8] hover:underline">← Zurück zur Übersicht</Link>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[#2B4066] sm:text-4xl">Ihr Paket zusammenstellen</h1>
        <p className="mt-2 max-w-2xl text-slate-600">In vier Schritten zu Ihrem Preis: Paket wählen, Entfernung prüfen, Leistungen ergänzen, anfragen.</p>

        <AsPackageWizard initial={initial} />

      </div>
    </main>
  );
}
