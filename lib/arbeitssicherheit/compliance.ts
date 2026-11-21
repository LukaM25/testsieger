import type { ASDashboardData, DocCategoryId } from "./types";
import { daysUntil, docStatus, latestByCategory, relativeDays, type DocStatus } from "./status";

export type PillarState = "ok" | "soon" | "action";
export type Level = "ok" | "attention" | "action";

export type Pillar = {
  id: string;
  title: string;
  norm: string;
  text: string;
  todo: string;
  state: PillarState;
  stateLabel: string;
  href: string;
};

export type Action = {
  id: string;
  /** 0 = sofort, 1 = fehlt, 2 = bald */
  priority: 0 | 1 | 2;
  title: string;
  detail: string;
  when?: string;
  href: string;
};

export type Compliance = {
  level: Level;
  headline: string;
  sub: string;
  okCount: number;
  total: number;
  pillars: Pillar[];
  actions: Action[];
};

const BASE = "/arbeitssicherheit/dashboard";

const PILLARS: { id: string; title: string; norm: string; text: string; todo: string; cats: DocCategoryId[]; href: string }[] = [
  { id: "gb", title: "Gefährdungsbeurteilung erstellt", norm: "§ 5, § 6 ArbSchG", text: "Gefahren im Betrieb beurteilt, Maßnahmen festgelegt und dokumentiert.", todo: "Gefährdungsbeurteilung für Ihren Betrieb erstellen und dokumentieren lassen.", cats: ["gefaehrdungsbeurteilung"], href: `${BASE}/dokumente` },
  { id: "uw", title: "Beschäftigte unterwiesen", norm: "§ 12 ArbSchG", text: "Unterweisungen durchgeführt und mit Nachweis dokumentiert.", todo: "Beschäftigte unterweisen und die Teilnahme nachweisen. Mindestens einmal im Jahr und bei neuen Tätigkeiten.", cats: ["unterweisungen"], href: `${BASE}/unterweisungen` },
  { id: "sifa", title: "Fachkraft für Arbeitssicherheit bestellt", norm: "§ 5 ASiG", text: "Schriftliche Bestellung mit Aufgaben und Einsatzzeit.", todo: "Fachkraft für Arbeitssicherheit schriftlich bestellen.", cats: ["bestellung-sifa"], href: `${BASE}/dokumente` },
  { id: "ba", title: "Betriebsarzt bestellt", norm: "§ 2 ASiG", text: "Arbeitsmedizinische Betreuung ist geregelt.", todo: "Betriebsarzt oder arbeitsmedizinischen Dienst bestellen.", cats: ["bestellung-betriebsarzt"], href: `${BASE}/dokumente` },
  { id: "eh", title: "Erste Hilfe organisiert", norm: "§ 10 ArbSchG", text: "Ersthelfer benannt, Erste-Hilfe-Material und Verbandbuch vorhanden.", todo: "Ersthelfer benennen und Erste-Hilfe-Material samt Verbandbuch bereitstellen.", cats: ["erste-hilfe"], href: `${BASE}/dokumente` },
  { id: "bs", title: "Brandschutz und Notfall geregelt", norm: "ArbStättV", text: "Flucht- und Rettungsplan und Brandschutzordnung liegen vor.", todo: "Flucht- und Rettungsplan sowie Brandschutzordnung erstellen und aushängen.", cats: ["brandschutz"], href: `${BASE}/dokumente` },
];

const CAT_TITLE: Record<string, string> = {
  "bestellung-sifa": "Bestellung Fachkraft für Arbeitssicherheit",
  "bestellung-betriebsarzt": "Bestellung Betriebsarzt",
  gefaehrdungsbeurteilung: "Gefährdungsbeurteilung",
  unterweisungen: "Unterweisungsnachweise",
  "erste-hilfe": "Erste Hilfe und Ersthelfer",
  brandschutz: "Brandschutz und Notfall",
};

function worst(states: DocStatus[]): PillarState {
  if (states.some((s) => s === "missing" || s === "expired")) return "action";
  if (states.some((s) => s === "expiring")) return "soon";
  return "ok";
}

export function buildCompliance(data: ASDashboardData, now = Date.now()): Compliance {
  const latest = latestByCategory(data.documents);
  const overdueTrainings = data.trainings.filter((t) => !t.completedAt && t.dueAt && daysUntil(t.dueAt, now) < 0);

  const pillars: Pillar[] = PILLARS.map((p) => {
    const states = p.cats.map((c) => docStatus(latest.get(c), now));
    let state = worst(states);
    if (p.id === "uw" && overdueTrainings.length) state = "action";
    const stateLabel = state === "ok" ? "In Ordnung" : state === "soon" ? "Bald fällig" : states.includes("missing") && !overdueTrainings.length ? "Offen" : "Handlungsbedarf";
    return { id: p.id, title: p.title, norm: p.norm, text: p.text, todo: p.todo, state, stateLabel, href: p.href };
  });

  const actions: Action[] = [];

  for (const [cat, title] of Object.entries(CAT_TITLE)) {
    const doc = latest.get(cat as DocCategoryId);
    const s = docStatus(doc, now);
    if (s === "expired" && doc?.validUntil) {
      actions.push({ id: `exp-${cat}`, priority: 0, title: `${title} ist abgelaufen`, detail: "Bitte aktualisieren lassen.", when: relativeDays(doc.validUntil, now), href: `${BASE}/dokumente` });
    } else if (s === "missing") {
      actions.push({ id: `miss-${cat}`, priority: 1, title: `${title} fehlt`, detail: "Noch keine Unterlage hinterlegt.", href: `${BASE}/dokumente` });
    } else if (s === "expiring" && doc?.validUntil) {
      actions.push({ id: `soon-${cat}`, priority: 2, title: `${title} läuft bald ab`, detail: "Rechtzeitig erneuern lassen.", when: relativeDays(doc.validUntil, now), href: `${BASE}/dokumente` });
    }
  }

  for (const t of data.trainings) {
    if (t.completedAt) continue;
    const open = Math.max(0, t.participantsTotal - t.participantsDone);
    const days = t.dueAt ? daysUntil(t.dueAt, now) : null;
    if (days !== null && days < 0) {
      actions.push({ id: `tr-${t.id}`, priority: 0, title: `Unterweisung überfällig: ${t.title}`, detail: `${open} Beschäftigte noch offen.`, when: relativeDays(t.dueAt!, now), href: `${BASE}/unterweisungen` });
    } else if (days !== null && days <= 60) {
      actions.push({ id: `tr-${t.id}`, priority: 2, title: `Unterweisung: ${t.title}`, detail: `${open} von ${t.participantsTotal} Beschäftigten noch offen.`, when: relativeDays(t.dueAt!, now), href: `${BASE}/unterweisungen` });
    }
  }

  for (const d of data.deadlines) {
    if (d.kind === "unterweisung" || d.kind === "dokument") continue; // oben schon erfasst
    const days = daysUntil(d.dueAt, now);
    if (days < 0) actions.push({ id: `dl-${d.id}`, priority: 0, title: `${d.title} überfällig`, detail: d.detail ?? "", when: relativeDays(d.dueAt, now), href: `${BASE}/fristen` });
    else if (days <= 60) actions.push({ id: `dl-${d.id}`, priority: 2, title: d.title, detail: d.detail ?? "", when: relativeDays(d.dueAt, now), href: `${BASE}/fristen` });
  }

  actions.sort((a, b) => a.priority - b.priority);

  const okCount = pillars.filter((p) => p.state === "ok").length;
  const level: Level = actions.some((a) => a.priority <= 1) ? "action" : actions.length > 0 ? "attention" : "ok";

  const n = actions.length;
  const headline =
    level === "ok"
      ? "Alles in Ordnung"
      : level === "attention"
        ? "Fast alles erledigt"
        : "Hier besteht Handlungsbedarf";
  const sub =
    n === 0
      ? "Alle Pflichtunterlagen sind aktuell, keine Frist steht an."
      : `${n} ${n === 1 ? "Punkt" : "Punkte"} ${level === "attention" ? "stehen demnächst an" : "brauchen Ihre Aufmerksamkeit"}.`;

  return { level, headline, sub, okCount, total: pillars.length, pillars, actions };
}
