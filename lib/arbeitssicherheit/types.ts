/**
 * Datenmodell des Arbeitssicherheits-Dashboards (getrennt vom Produkttest-Dashboard).
 *
 * Die Kategorien unten sind die feste Struktur der Dokumentenmappe. Was in den Kategorien
 * liegt, füllt die Fachkraft später pro Kunde. Die Kategorien selbst ändern sich selten.
 */

export type DocCategoryId =
  | "bestellung-sifa"
  | "bestellung-betriebsarzt"
  | "gefaehrdungsbeurteilung"
  | "betriebsanweisungen"
  | "unterweisungen"
  | "begehungen"
  | "erste-hilfe"
  | "brandschutz"
  | "arbeitsmittel"
  | "unfaelle"
  | "sonstiges";

export type DocCategory = {
  id: DocCategoryId;
  title: string;
  hint: string;
  /** Basisunterlage: zählt in die Übersicht "Basisunterlagen vorhanden". */
  basic: boolean;
};

export const DOC_CATEGORIES: DocCategory[] = [
  {
    id: "bestellung-sifa",
    title: "Bestellung Fachkraft für Arbeitssicherheit",
    hint: "Schriftliche Bestellung mit Aufgaben und Einsatzzeit.",
    basic: true,
  },
  {
    id: "bestellung-betriebsarzt",
    title: "Bestellung Betriebsarzt",
    hint: "Schriftliche Bestellung oder Vertrag mit dem arbeitsmedizinischen Dienst.",
    basic: true,
  },
  {
    id: "gefaehrdungsbeurteilung",
    title: "Gefährdungsbeurteilung",
    hint: "Ergebnis der Beurteilung mit Maßnahmen und Stand.",
    basic: true,
  },
  {
    id: "unterweisungen",
    title: "Unterweisungsnachweise",
    hint: "Wer wann zu welchem Thema unterwiesen wurde.",
    basic: true,
  },
  {
    id: "erste-hilfe",
    title: "Erste Hilfe und Ersthelfer",
    hint: "Ersthelfer, Verbandbuch und Erste-Hilfe-Material.",
    basic: true,
  },
  {
    id: "brandschutz",
    title: "Brandschutz und Notfall",
    hint: "Flucht- und Rettungsplan, Brandschutzordnung, Notfallnummern.",
    basic: true,
  },
  {
    id: "betriebsanweisungen",
    title: "Betriebsanweisungen",
    hint: "Für Maschinen, Arbeitsmittel und Gefahrstoffe, soweit relevant.",
    basic: false,
  },
  {
    id: "begehungen",
    title: "Begehungsprotokolle",
    hint: "Protokolle und Maßnahmenlisten aus den Betriebsbegehungen.",
    basic: false,
  },
  {
    id: "arbeitsmittel",
    title: "Prüfnachweise Arbeitsmittel",
    hint: "Prüfungen von Maschinen, Leitern, Fahrzeugen und Geräten.",
    basic: false,
  },
  {
    id: "unfaelle",
    title: "Unfälle und Beinaheunfälle",
    hint: "Unfallanzeigen und Auswertungen.",
    basic: false,
  },
  {
    id: "sonstiges",
    title: "Sonstiges",
    hint: "Weitere Unterlagen zur Arbeitssicherheit.",
    basic: false,
  },
];

export type ASDocument = {
  id: string;
  categoryId: DocCategoryId;
  title: string;
  fileName: string | null;
  /** ISO-Datum der letzten Änderung. */
  updatedAt: string;
  /** ISO-Datum, bis wann das Dokument gültig bzw. aktuell ist. Leer = unbefristet. */
  validUntil: string | null;
  /** Wird gesetzt, sobald der Download-Weg (signierte URL) angeschlossen ist. */
  downloadUrl: string | null;
};

export type ASTraining = {
  id: string;
  title: string;
  topic: string;
  /** ISO-Datum, wann die Unterweisung fällig ist. */
  dueAt: string | null;
  completedAt: string | null;
  participantsDone: number;
  participantsTotal: number;
};

export type ASDeadlineKind = "dokument" | "unterweisung" | "begehung";

export type ASDeadline = {
  id: string;
  kind: ASDeadlineKind;
  title: string;
  detail?: string;
  /** ISO-Datum der Fälligkeit. */
  dueAt: string;
  href?: string;
};

export type ASContact = {
  name: string;
  role: string;
  email: string;
  phone: string;
};

export type ASDashboardData = {
  preview: boolean;
  company: { name: string; industry: string | null; employees: number | null; bg?: string | null };
  contact: ASContact;
  documents: ASDocument[];
  trainings: ASTraining[];
  deadlines: ASDeadline[];
  nextInspection: string | null;
};
