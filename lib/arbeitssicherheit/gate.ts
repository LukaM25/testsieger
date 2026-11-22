import { notFound } from "next/navigation";

/**
 * Gemeinsame Freigabe-Sperre für alle Seiten rund um Arbeitssicherheit
 * (Landingpage, Registrierung, Kunden- und Admin-Dashboard).
 *
 * Seit 22.11.2026 freigegeben (Anfragen werden erst nach Abschluss der SiFa-Ausbildung angenommen).
 * Zum erneuten Sperren: ARBEITSSICHERHEIT_LIVE auf false setzen.
 */
export const ARBEITSSICHERHEIT_LIVE = true;

export function arbeitssicherheitEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || ARBEITSSICHERHEIT_LIVE;
}

export function assertArbeitssicherheitAccess() {
  if (!arbeitssicherheitEnabled()) notFound();
}
