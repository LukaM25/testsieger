import Link from "next/link";
import { loadDashboardData } from "@/lib/arbeitssicherheit/data";
import { deadlineGroup, formatDate, relativeDays, type DeadlineGroup } from "@/lib/arbeitssicherheit/status";
import type { ASDeadlineKind } from "@/lib/arbeitssicherheit/types";
import { CARD, EmptyState, PageHead, PreviewBanner } from "../ui";

type Props = { searchParams?: Promise<{ preview?: string }> };

const KIND: Record<ASDeadlineKind, string> = {
  dokument: "Dokument",
  unterweisung: "Unterweisung",
  begehung: "Begehung",
};

const GROUPS: { id: DeadlineGroup; title: string; tone: string }[] = [
  { id: "overdue", title: "Überfällig", tone: "text-rose-700" },
  { id: "soon", title: "In den nächsten 60 Tagen", tone: "text-amber-800" },
  { id: "later", title: "Später", tone: "text-slate-500" },
];

export default async function ASFristen({ searchParams }: Props) {
  const data = await loadDashboardData(searchParams);
  const q = data.preview ? "?preview=1" : "";
  const sorted = [...data.deadlines].sort((a, b) => a.dueAt.localeCompare(b.dueAt));

  return (
    <div>
      {data.preview ? <PreviewBanner /> : null}
      <PageHead title="Fristen" text="Was in Ihrem Betrieb wann ansteht. Sie müssen nichts im Kopf behalten." />

      {sorted.length === 0 ? (
        <div className="mt-6"><EmptyState title="Keine Fristen eingetragen" text="Termine für Unterweisungen, Begehungen und Aktualisierungen erscheinen hier automatisch." /></div>
      ) : (
        GROUPS.map((g) => {
          const items = sorted.filter((d) => deadlineGroup(d) === g.id);
          if (items.length === 0) return null;
          return (
            <section key={g.id} className="mt-8">
              <h2 className={`text-sm font-semibold uppercase tracking-[0.2em] ${g.tone}`}>{g.title}</h2>
              <ul className={`${CARD} mt-3 divide-y divide-slate-100`}>
                {items.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{d.title}</p>
                      <p className="text-xs text-slate-500">
                        {KIND[d.kind]} · {formatDate(d.dueAt)}
                        {d.detail ? ` · ${d.detail}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-600">{relativeDays(d.dueAt)}</span>
                      {d.href ? (
                        <Link href={`${d.href}${q}`} className="text-sm font-semibold text-[#1d4ed8] hover:underline">Öffnen</Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
