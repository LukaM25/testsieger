
import Hero from "@/components/Hero";

export default function Page() {
  return (
    <div className="space-y-10">
      <Hero />
      <div id="ablauf" className="card">
        <p className="font-semibold">Ablauf</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Pre‑Check ausfüllen (0 €)</li>
          <li>Paket wählen & bezahlen</li>
          <li>Produkt einsenden</li>
          <li>Prüfbericht & Zertifikat erhalten</li>
          <li>Öffentliche Verifikation via QR</li>
        </ol>
      </div>
    </div>
  );
}
