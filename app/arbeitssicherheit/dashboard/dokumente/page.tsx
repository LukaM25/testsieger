import { loadDashboardData } from "@/lib/arbeitssicherheit/data";
import DocList from "../DocList";
import { PageHead, PreviewBanner } from "../ui";

type Props = { searchParams?: Promise<{ preview?: string }> };

export default async function ASDokumente({ searchParams }: Props) {
  const data = await loadDashboardData(searchParams);

  return (
    <div>
      {data.preview ? <PreviewBanner /> : null}
      <PageHead
        title="Dokumentenmappe"
        text="Alle Unterlagen zur Arbeitssicherheit Ihres Betriebs, nach Themen geordnet. Ihre Fachkraft pflegt sie für Sie."
      />
      <div className="mt-6">
        <DocList documents={data.documents} />
      </div>
    </div>
  );
}
