import { pageMetadata } from "@/lib/seo";
import PruefverfahrenPage from "@/pruf/PruefverfahrenPage";
import data from "@/pruf/pdfExtract.pruefverfahren.json";

export const metadata = pageMetadata({
  title: 'Prüfverfahren und Prüfkriterien',
  description:
    'So prüfen wir: dokumentierte Prüfkriterien und Bewertungsmaßstäbe nach DPI-Standard. Nachvollziehbar, transparent und mit Prüfbericht.',
  path: '/pruefverfahren',
});

export default function PruefverfahrenRoute() {
  return <PruefverfahrenPage data={data} />;
}
