import type { ASDeadline, ASDocument } from "./types";

export const EXPIRING_DAYS = 60;

export type DocStatus = "missing" | "valid" | "expiring" | "expired";

const DAY = 24 * 60 * 60 * 1000;

export function daysUntil(iso: string, now = Date.now()): number {
  return Math.ceil((new Date(iso).getTime() - now) / DAY);
}

export function docStatus(doc: ASDocument | undefined, now = Date.now()): DocStatus {
  if (!doc) return "missing";
  if (!doc.validUntil) return "valid";
  const d = daysUntil(doc.validUntil, now);
  if (d < 0) return "expired";
  if (d <= EXPIRING_DAYS) return "expiring";
  return "valid";
}

/** Das gültigste Dokument je Kategorie (zuletzt geändert zuerst). */
export function latestByCategory(documents: ASDocument[]): Map<string, ASDocument> {
  const map = new Map<string, ASDocument>();
  for (const d of [...documents].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))) {
    if (!map.has(d.categoryId)) map.set(d.categoryId, d);
  }
  return map;
}

export type DeadlineGroup = "overdue" | "soon" | "later";

export function deadlineGroup(d: ASDeadline, now = Date.now()): DeadlineGroup {
  const days = daysUntil(d.dueAt, now);
  if (days < 0) return "overdue";
  if (days <= EXPIRING_DAYS) return "soon";
  return "later";
}

const dateFmt = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

const shortFmt = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateShort = (iso: string) => shortFmt.format(new Date(iso));

export function relativeDays(iso: string, now = Date.now()): string {
  const d = daysUntil(iso, now);
  if (d < 0) return `seit ${Math.abs(d)} ${Math.abs(d) === 1 ? "Tag" : "Tagen"} überfällig`;
  if (d === 0) return "heute";
  if (d === 1) return "morgen";
  return `in ${d} Tagen`;
}
