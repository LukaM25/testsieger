import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, jobPostingJsonLd, pageMetadata } from "@/lib/seo";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Headset,
  Mail,
  MessagesSquare,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";

const CONTACT_EMAIL = "info@dpi-siegel.de";
const MAIL_SUBJECT = "Bewerbung Praktikum";

export const metadata = pageMetadata({
  title: "Karriere: Praktikum beim Deutschen Prüfsiegel Institut",
  description:
    "Praktikum (m/w/d) beim Deutschen Prüfsiegel Institut in Oberbayern: Produkte prüfen, Prüfberichte vorbereiten und das Testsieger-Prüfverfahren lernen. Mit Einarbeitung und Schulung.",
  path: "/karriere",
});

const tasks: { Icon: LucideIcon; title: string; body: string }[] = [
  {
    Icon: PackageSearch,
    title: "Produkte prüfen",
    body: "Du prüfst eingesandte Produkte nach unseren festen Kriterien und dokumentierst, was du siehst.",
  },
  {
    Icon: FileText,
    title: "Prüfberichte vorbereiten",
    body: "Du hältst Ergebnisse sauber fest und arbeitest an verständlichen Berichten mit.",
  },
  {
    Icon: Headset,
    title: "Kundenanfragen begleiten",
    body: "Du hilfst bei Rückfragen von Händlern und sorgst dafür, dass jede Anfrage eine klare Antwort bekommt.",
  },
];

const profile = [
  "Sorgfalt und ein gutes Auge für Details",
  "Spaß an Produkten, Qualität und Verarbeitung",
  "Freude an verständlicher, ehrlicher Kommunikation",
  "Zuverlässigkeit und Lust, Neues zu lernen",
  "Gutes Deutsch in Wort und Schrift",
];

const onboarding: { Icon: LucideIcon; title: string; body: string }[] = [
  {
    Icon: UserRoundCheck,
    title: "Persönlicher Start",
    body: "Du bekommst eine feste Ansprechperson und einen klaren Plan für die ersten Wochen.",
  },
  {
    Icon: GraduationCap,
    title: "Schulung zum Prüfverfahren",
    body: "Wir bringen dir unser Testsieger-Check-System bei: Kriterien, gewichtete Bewertung und Siegel-Logik.",
  },
  {
    Icon: ClipboardCheck,
    title: "Lernen an echten Fällen",
    body: "Du übernimmst Schritt für Schritt Aufgaben aus dem Alltag und bekommst regelmäßig Feedback.",
  },
];

const steps = [
  { title: "Kurze Mail", body: "Schick uns ein paar Zeilen zu dir und, wenn vorhanden, einen Lebenslauf." },
  { title: "Kennenlernen", body: "Wir melden uns innerhalb einer Woche und sprechen in Ruhe über deine Ziele." },
  { title: "Start", body: "Wir klären Zeitraum und Ablauf gemeinsam und planen deine Einarbeitung." },
];

const mailHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(MAIL_SUBJECT)}`;

export default function KarrierePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50/50 text-slate-900">
      <JsonLd
        data={[
          jobPostingJsonLd(),
          breadcrumbJsonLd([
            { name: "Start", path: "/" },
            { name: "Karriere", path: "/karriere" },
          ]),
        ]}
      />
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-12 pt-16 sm:pt-20">
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700 ring-1 ring-sky-100">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Karriere
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-[#2B4066] sm:text-5xl">
            Lerne, wie echtes Vertrauen entsteht.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
            Beim Deutschen Prüfsiegel Institut prüfen wir Produkte nach festen, nachvollziehbaren Kriterien. Wenn du Qualität
            ernst nimmst und von Anfang an mitarbeiten willst, bist du bei uns richtig.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={mailHref}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d] px-7 py-3.5 text-sm font-semibold !text-white shadow-[0_14px_28px_-16px_rgba(29,78,216,0.7)] transition duration-300 hover:-translate-y-0.5"
            >
              Jetzt bewerben
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </a>
            <a href="#stelle" className="text-sm font-semibold text-sky-700 hover:underline">
              Zur offenen Stelle
            </a>
          </div>
        </div>
      </section>

      {/* Stelle */}
      <section id="stelle" className="scroll-mt-24 px-6 pb-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_30px_70px_-40px_rgba(43,64,102,0.4)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-sky-50/70 to-white px-8 py-6">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Offene Stelle</span>
              <h2 className="mt-1 text-2xl font-semibold text-[#2B4066]">Praktikum (m/w/d)</h2>
              <p className="mt-1 text-sm text-slate-500">Produktprüfung &amp; Kundenservice</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1">Zeitraum nach Absprache</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Mit Einarbeitung &amp; Schulung</span>
            </div>
          </div>

          <div className="grid gap-10 p-8 lg:grid-cols-[1.25fr,0.75fr]">
            <div>
              <h3 className="text-lg font-semibold text-[#2B4066]">Das erwartet dich</h3>
              <div className="mt-4 grid gap-4">
                {tasks.map(({ Icon, title, body }) => (
                  <div key={title} className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700 ring-1 ring-sky-100">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h4 className="font-semibold text-slate-900">{title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[#2B4066]">Das bringst du mit</h3>
              <ul className="mt-4 space-y-3">
                {profile.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
                Kein Vorwissen nötig. Das Prüfverfahren lernst du bei uns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Einarbeitung */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-b from-[#16294d] to-[#0b1730] p-8 text-white shadow-[0_30px_70px_-35px_rgba(11,23,48,0.8)] sm:p-10">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-200">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Einarbeitung &amp; Schulung
          </span>
          <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Du startest nicht ins kalte Wasser.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {onboarding.map(({ Icon, title, body }) => (
              <div key={title} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 transition duration-300 hover:bg-white/10">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-sky-200">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/70">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ablauf + Kontakt */}
      <section className="px-6 pb-20 pt-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold text-[#2B4066]">So läuft die Bewerbung</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(43,64,102,0.35)]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sm font-semibold text-sky-700 ring-1 ring-sky-100">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-[0_20px_60px_-40px_rgba(43,64,102,0.35)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700 ring-1 ring-sky-100">
              <Mail className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="text-xl font-semibold text-[#2B4066]">Neugierig geworden?</h2>
            <p className="max-w-xl text-sm leading-relaxed text-slate-600">
              Schick uns deine Unterlagen oder einfach ein paar Zeilen über dich an{" "}
              <a href={mailHref} className="font-semibold text-sky-700 hover:underline">{CONTACT_EMAIL}</a>.
              Du kannst auch unser Kontaktformular nutzen.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href={mailHref}
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#16294d] px-7 py-3 text-sm font-semibold !text-white shadow-[0_14px_28px_-16px_rgba(29,78,216,0.7)] transition duration-300 hover:-translate-y-0.5"
              >
                Per E-Mail bewerben
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </a>
              <Link
                href="/kontakt"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-[#2B4066] transition duration-300 hover:-translate-y-0.5 hover:border-sky-300"
              >
                <MessagesSquare className="h-4 w-4" aria-hidden="true" />
                Kontaktformular
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
