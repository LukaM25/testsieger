import PruefverfahrenPage from "@/pruf/PruefverfahrenPage";
import data from "@/pruf/pdfExtract.pruefverfahren.json";

export const metadata = {
  title: "Prüfverfahren – Prüfsiegel Zentrum UG",
  description: "Dokumentierte Prüfkriterien und Bewertungsmaßstäbe für das Testsieger Siegel.",
};

export default function PruefverfahrenRoute() {
  return <PruefverfahrenPage data={data} />;
}
