import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ORG } from "@/lib/seo";
import type { ASDashboardData } from "./types";

type SearchParams = Promise<{ preview?: string }> | { preview?: string } | undefined;

const CONTACT = {
  name: "Ferdinand Lang",
  role: "Fachkraft für Arbeitssicherheit",
  email: ORG.email,
  phone: ORG.telephone,
};

const DAY = 24 * 60 * 60 * 1000;
const inDays = (n: number) => new Date(Date.now() + n * DAY).toISOString();

/** Beispieldaten, nur lokal über ?preview=1 sichtbar. Zeigen, wie ein gefülltes Dashboard aussieht. */
export function previewData(): ASDashboardData {
  return {
    preview: true,
    company: { name: "Mustermann Garten- und Landschaftsbau GmbH", industry: "Garten- und Landschaftsbau", employees: 12, bg: "BG BAU" },
    contact: CONTACT,
    documents: [
      { id: "d1", categoryId: "bestellung-sifa", title: "Bestellung Fachkraft für Arbeitssicherheit", fileName: "bestellung-sifa.pdf", updatedAt: inDays(-90), validUntil: null, downloadUrl: null },
      { id: "d2", categoryId: "bestellung-betriebsarzt", title: "Vertrag arbeitsmedizinischer Dienst", fileName: "betriebsarzt-vertrag.pdf", updatedAt: inDays(-90), validUntil: null, downloadUrl: null },
      { id: "d3", categoryId: "gefaehrdungsbeurteilung", title: "Gefährdungsbeurteilung Garten- und Landschaftsbau", fileName: "gefaehrdungsbeurteilung-2026.pdf", updatedAt: inDays(-40), validUntil: inDays(325), downloadUrl: null },
      { id: "d4", categoryId: "unterweisungen", title: "Unterweisung Absturzsicherung und Leitern", fileName: "unterweisung-leitern.pdf", updatedAt: inDays(-300), validUntil: inDays(25), downloadUrl: null },
      { id: "d5", categoryId: "betriebsanweisungen", title: "Betriebsanweisung Motorsäge", fileName: "ba-motorsaege.pdf", updatedAt: inDays(-35), validUntil: null, downloadUrl: null },
      { id: "d6", categoryId: "betriebsanweisungen", title: "Betriebsanweisung Heckenschere", fileName: "ba-heckenschere.pdf", updatedAt: inDays(-35), validUntil: null, downloadUrl: null },
      { id: "d7", categoryId: "begehungen", title: "Begehung Betriebshof", fileName: "begehung-betriebshof.pdf", updatedAt: inDays(-38), validUntil: null, downloadUrl: null },
    ],
    trainings: [
      { id: "t1", title: "Absturzsicherung und Leitern", topic: "Arbeiten in der Höhe", dueAt: inDays(25), completedAt: null, participantsDone: 9, participantsTotal: 12 },
      { id: "t2", title: "Umgang mit der Motorsäge", topic: "Maschinen und Arbeitsmittel", dueAt: inDays(120), completedAt: null, participantsDone: 4, participantsTotal: 6 },
      { id: "t3", title: "Verhalten bei Unfall und Notfall", topic: "Erste Hilfe", dueAt: null, completedAt: inDays(-70), participantsDone: 12, participantsTotal: 12 },
    ],
    deadlines: [
      { id: "f1", kind: "unterweisung", title: "Unterweisung Absturzsicherung und Leitern", detail: "3 von 12 Beschäftigten offen", dueAt: inDays(25), href: "/arbeitssicherheit/dashboard/unterweisungen" },
      { id: "f2", kind: "begehung", title: "Betriebsbegehung", detail: "Jährliche Begehung mit Ihrer Fachkraft", dueAt: inDays(48) },
      { id: "f3", kind: "unterweisung", title: "Unterweisung Motorsäge", detail: "2 von 6 Beschäftigten offen", dueAt: inDays(120), href: "/arbeitssicherheit/dashboard/unterweisungen" },
      { id: "f4", kind: "dokument", title: "Gefährdungsbeurteilung aktualisieren", dueAt: inDays(325), href: "/arbeitssicherheit/dashboard/dokumente" },
    ],
    nextInspection: inDays(48),
  };
}

function emptyData(company: string): ASDashboardData {
  return {
    preview: false,
    company: { name: company, industry: null, employees: null, bg: null },
    contact: CONTACT,
    documents: [],
    trainings: [],
    deadlines: [],
    nextInspection: null,
  };
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

/** Diese Beziehungen werden für Dashboard und Admin gemeinsam geladen. */
export const orgInclude = {
  documents: { orderBy: { updatedAt: "desc" } },
  trainings: { orderBy: { createdAt: "desc" } },
  deadlines: { where: { doneAt: null }, orderBy: { dueAt: "asc" } },
} satisfies Prisma.ASOrganizationInclude;

export type OrgWithRelations = Prisma.ASOrganizationGetPayload<{ include: typeof orgInclude }>;

export function toDashboardData(org: OrgWithRelations): ASDashboardData {
  return {
    preview: false,
    company: { name: org.name, industry: org.industry, employees: org.employees, bg: org.bg },
    contact: CONTACT,
    documents: org.documents.map((d) => ({
      id: d.id,
      categoryId: d.categoryId as ASDashboardData["documents"][number]["categoryId"],
      title: d.title,
      fileName: d.fileName,
      updatedAt: d.updatedAt.toISOString(),
      validUntil: iso(d.validUntil),
      downloadUrl: d.assetKey ? `/api/arbeitssicherheit/documents/${d.id}` : null,
    })),
    trainings: org.trainings.map((t) => ({
      id: t.id,
      title: t.title,
      topic: t.topic,
      dueAt: iso(t.dueAt),
      completedAt: iso(t.completedAt),
      participantsDone: t.participantsDone,
      participantsTotal: t.participantsTotal,
    })),
    deadlines: org.deadlines.map((d) => ({
      id: d.id,
      kind: d.kind as ASDashboardData["deadlines"][number]["kind"],
      title: d.title,
      detail: d.detail ?? undefined,
      dueAt: d.dueAt.toISOString(),
    })),
    nextInspection: iso(org.nextInspectionAt),
  };
}

/**
 * Lädt die Dashboard-Daten des angemeldeten Kunden aus der Datenbank.
 * Nur Kunden des Bereichs Arbeitssicherheit kommen hinein; alle anderen gehen zu ihrem Dashboard.
 */
export async function loadDashboardData(searchParams?: SearchParams): Promise<ASDashboardData> {
  const sp = await Promise.resolve(searchParams);
  if (process.env.NODE_ENV !== "production" && sp?.preview === "1") return previewData();

  const session = await getSession();
  if (!session) redirect("/login?next=/arbeitssicherheit/dashboard");

  const user = await prisma.user.findFirst({
    where: { id: session.userId, active: true, deletedAt: null },
    select: {
      name: true,
      company: true,
      area: true,
      asOrganization: { include: orgInclude },
    },
  });
  if (!user) redirect("/login?next=/arbeitssicherheit/dashboard");
  if (user.area !== "ARBEITSSICHERHEIT") redirect("/dashboard");

  if (!user.asOrganization) return emptyData(user.company?.trim() || user.name);
  return toDashboardData(user.asOrganization);
}
