export type Area = "PRODUKTTEST" | "ARBEITSSICHERHEIT";

export const AREA_HOME: Record<Area, string> = {
  PRODUKTTEST: "/dashboard",
  ARBEITSSICHERHEIT: "/arbeitssicherheit/dashboard",
};

export const AREA_LABEL: Record<Area, string> = {
  PRODUKTTEST: "Produkttest & Prüfsiegel",
  ARBEITSSICHERHEIT: "Arbeitssicherheit",
};

/** Zielseite nach Login/Registrierung. Eine `next`-Adresse zählt nur, wenn sie zum Bereich des Kontos passt. */
export function postAuthRedirect(area: Area, next?: string | null): string {
  const home = AREA_HOME[area];
  if (!next || !next.startsWith("/") || next.startsWith("//")) return home;
  const isAs = next.startsWith("/arbeitssicherheit");
  if (area === "ARBEITSSICHERHEIT" ? isAs : !isAs) return next;
  return home;
}
