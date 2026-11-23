/**
 * Auswahllisten für die Betriebsangaben bei Arbeitssicherheit.
 * Orientiert an den Abfragen der großen Anbieter: Größe, Branche, Berufsgenossenschaft,
 * Gefährdungsschwerpunkte und vorhandene Maßnahmen. Daraus lässt sich Betreuungsumfang
 * (DGUV Vorschrift 2) und Gefährdungsbeurteilung ableiten.
 */

export const LEGAL_FORMS = [
  "Einzelunternehmen",
  "GbR",
  "GmbH",
  "UG (haftungsbeschränkt)",
  "GmbH & Co. KG",
  "KG / OHG",
  "e. K.",
  "Verein / gemeinnützig",
  "Sonstige",
] as const;

export const INDUSTRIES = [
  "Garten- und Landschaftsbau",
  "Bauhauptgewerbe",
  "Ausbaugewerbe (Maler, Trockenbau, Fliesen)",
  "Elektro, SHK (Sanitär, Heizung, Klima)",
  "Metall und Maschinenbau",
  "Holz und Schreinerei",
  "Kfz und Werkstatt",
  "Handel und Verkauf",
  "Gastronomie und Hotel",
  "Büro und Dienstleistung",
  "Gesundheit und Pflege",
  "Logistik und Transport",
  "Produktion und Industrie",
  "Land- und Forstwirtschaft",
  "Sonstiges",
] as const;

export const BERUFSGENOSSENSCHAFTEN = [
  "BG BAU",
  "BG ETEM",
  "BGHM",
  "BGN",
  "BG RCI",
  "BGW",
  "BG Verkehr",
  "VBG",
  "SVLFG",
  "Unfallkasse",
  "Weiß ich nicht",
] as const;

export const EMPLOYEE_HINT = "Inklusive Teilzeit, Aushilfen und Auszubildenden. Ohne Inhaber.";

export const RISKS = [
  { id: "HOEHE", label: "Arbeiten in der Höhe, Leitern, Gerüste" },
  { id: "MASCHINEN", label: "Maschinen und handgeführte Geräte" },
  { id: "FAHRZEUGE", label: "Fahrzeuge, Transport, Flurförderzeuge" },
  { id: "GEFAHRSTOFFE", label: "Gefahrstoffe, Chemikalien" },
  { id: "BAUSTELLE", label: "Baustellen oder wechselnde Einsatzorte" },
  { id: "LAERM", label: "Lärm, Staub oder Vibration" },
  { id: "LASTEN", label: "Schweres Heben und Tragen" },
  { id: "BILDSCHIRM", label: "Überwiegend Bildschirmarbeit" },
] as const;

export const EXISTING = [
  { id: "GEFAEHRDUNGSBEURTEILUNG", label: "Gefährdungsbeurteilung liegt vor" },
  { id: "SIFA", label: "Fachkraft für Arbeitssicherheit ist bestellt" },
  { id: "BETRIEBSARZT", label: "Betriebsarzt ist bestellt" },
  { id: "ERSTHELFER", label: "Ersthelfer sind benannt" },
  { id: "UNTERWEISUNG", label: "Unterweisungen werden dokumentiert" },
] as const;

export const RISK_IDS: string[] = RISKS.map((r) => r.id);
export const EXISTING_IDS: string[] = EXISTING.map((r) => r.id);

/** Größenklasse für die Anzeige, angelehnt an die Staffelung in DGUV Vorschrift 2. */
export function sizeClass(employees: number): string {
  if (employees <= 10) return "bis 10 Beschäftigte";
  if (employees <= 50) return "11 bis 50 Beschäftigte";
  return "über 50 Beschäftigte";
}
