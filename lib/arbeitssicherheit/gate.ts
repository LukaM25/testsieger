import { notFound } from "next/navigation";

/**
 * Gemeinsame Freigabe-Sperre für alle Seiten rund um Arbeitssicherheit
 * (Landingpage, Registrierung, Kunden- und Admin-Dashboard).
 *
 * - Lokal (npm run dev) ist alles sichtbar.
 * - In Produktion ist alles gesperrt, solange SHOW_ARBEITSSICHERHEIT nicht "1" ist.
 */
export const ARBEITSSICHERHEIT_LIVE = process.env.SHOW_ARBEITSSICHERHEIT === "1";

export function arbeitssicherheitEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || ARBEITSSICHERHEIT_LIVE;
}

export function assertArbeitssicherheitAccess() {
  if (!arbeitssicherheitEnabled()) notFound();
}
