import { loadDashboardData } from "@/lib/arbeitssicherheit/data";
import { formatDateShort, relativeDays } from "@/lib/arbeitssicherheit/status";
import { CARD, EmptyState, PageHead, PreviewBanner, ProgressBar } from "../ui";

type Props = { searchParams?: Promise<{ preview?: string }> };

export default async function ASUnterweisungen({ searchParams }: Props) {
  const data = await loadDashboardData(searchParams);
  const open = data.trainings.filter((t) => !t.completedAt);
  const done = data.trainings.filter((t) => t.completedAt);

  const Row = ({ t }: { t: (typeof data.trainings)[number] }) => (
    <li className={`${CARD} p-5`} data-animate="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-[#2B4066]">{t.title}</p>
          <p className="text-sm text-slate-500">{t.topic}</p>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {t.completedAt
            ? `Abgeschlossen am ${formatDateShort(t.completedAt)}`
            : t.dueAt
              ? `Fällig ${formatDateShort(t.dueAt)} (${relativeDays(t.dueAt)})`
              : "Ohne Termin"}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="flex-1"><ProgressBar value={t.participantsDone} max={t.participantsTotal} /></div>
        <span className="text-xs font-semibold text-slate-600">
          {t.participantsDone} von {t.participantsTotal} unterwiesen
        </span>
      </div>
    </li>
  );

  return (
    <div>
      {data.preview ? <PreviewBanner /> : null}
      <PageHead
        title="Unterweisungen"
        text="Der Nachweis, wer wann zu welchem Thema unterwiesen wurde. Die Unterweisung ist Pflicht und muss dokumentiert sein."
      />

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Offen</h2>
      <div className="mt-3">
        {open.length === 0 ? (
          <EmptyState title="Keine offenen Unterweisungen" text="Sobald eine Unterweisung ansteht, sehen Sie hier den Stand pro Thema." />
        ) : (
          <ul className="space-y-3">{open.map((t) => <Row key={t.id} t={t} />)}</ul>
        )}
      </div>

      {done.length > 0 ? (
        <>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Abgeschlossen</h2>
          <ul className="mt-3 space-y-3">{done.map((t) => <Row key={t.id} t={t} />)}</ul>
        </>
      ) : null}
    </div>
  );
}
