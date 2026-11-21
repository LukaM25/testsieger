/**
 * PREISE Arbeitssicherheit. Alles netto, zuzüglich Umsatzsteuer.
 * TODO Ferdi: Preise sind Vorschläge (Stand 21.11.2026, orientiert an Marktpreisen). Vor der Freigabe bestätigen.
 * Hier zentral ändern, die Seiten ziehen sich die Werte von hier.
 */
export type PkgKey = "start" | "betreuung" | "enterprise";

export const PACKAGES_PRICING = {
  start: {
    name: "Start",
    for: "Kleinstbetriebe bis 10 Beschäftigte",
    tiers: [{ label: "bis 10 Beschäftigte", monthly: 89 }],
    setup: 390,
    visits: 1,
  },
  betreuung: {
    name: "Betreuung",
    for: "Betriebe mit 11 bis 50 Beschäftigten",
    tiers: [
      { label: "11 bis 25 Beschäftigte", monthly: 169 },
      { label: "26 bis 50 Beschäftigte", monthly: 259 },
    ],
    setup: 490,
    visits: 2,
  },
  enterprise: {
    name: "Enterprise",
    for: "Alles inklusive, bis 50 Beschäftigte",
    tiers: [{ label: "bis 50 Beschäftigte", monthly: 590 }],
    setup: 790,
    visits: 3,
  },
} as const;

export type ExtraPrice = { monthly?: number; once?: number; perVisit?: number; label: string };
export const EXTRA_PRICES: Record<string, ExtraPrice> = {
  begehung: { perVisit: 190, label: "190 € je Termin + Anfahrt" },
  notfall: { once: 190, label: "190 € einmalig" },
  banw: { once: 290, label: "290 € einmalig" },
  gefahr: { once: 290, label: "290 € einmalig" },
  pruef: { once: 190, label: "190 € einmalig" },
  helfer: { monthly: 9, label: "9 € / Monat" },
  vorsorge: { monthly: 9, label: "9 € / Monat" },
  schulung: { perVisit: 160, label: "160 € je Termin + Anfahrt" },
};

export const eur = (n: number) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** Anfahrt: Ausgangspunkt Gmund am Tegernsee. Bis INCLUDED_KM (einfache Strecke) inklusive, darüber je km. */
export const BASE_POINT = { lat: 47.7437, lon: 11.7326, label: "Tegernseer Tal" };
export const INCLUDED_KM = 30;
export const RATE_PER_EXTRA_KM = 1.6; // € je Kilometer über INCLUDED_KM, einfache Strecke, deckt Hin- und Rückfahrt
export const MAX_KM = 150; // darüber auf Anfrage

export type Travel =
  | { state: "unknown" }
  | { state: "included"; km: number }
  | { state: "fee"; km: number; fee: number }
  | { state: "request"; km: number };

export function travelFor(km: number | null): Travel {
  if (km === null) return { state: "unknown" };
  if (km <= INCLUDED_KM) return { state: "included", km };
  if (km > MAX_KM) return { state: "request", km };
  const fee = Math.round(((km - INCLUDED_KM) * RATE_PER_EXTRA_KM) / 5) * 5;
  return { state: "fee", km, fee };
}
