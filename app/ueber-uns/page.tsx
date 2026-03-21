import Image from "next/image";

export const metadata = {
  title: "Über uns – Prüfsiegel Zentrum UG",
  description: "Über das Deutsche Prüfsiegel Institut (DPI) und den Testsieger Check.",
};

export default function UeberUnsPage() {
  const team = [
    {
      name: "Ferdinand Lang",
      title: "Experte für Freiraum, Sicherheit und Spielplatzprüfungen nach DIN",
      image: "/ueberuns/ferdinand-lang.jpeg",
      body: "Als gelernter Garten- und Landschaftsbauer mit Meisterabschluss in Management und Gestaltung sowie einem Abschluss als Wirtschafter (Landshut) bringt Ferdinand fundiertes, operatives Fachwissen in unsere Prüfungsprozesse ein. Sein besonderer Fokus liegt auf der Sicherheit im öffentlichen und privaten Raum, insbesondere auf professionellen Spielplatzprüfungen nach DIN (wie der DIN EN 1176). Diese Expertise ist nicht am Schreibtisch entstanden, sondern tief in der handwerklichen Realität verwurzelt: Durch seine weitreichende Erfahrung im direkten Spielplatzbau und der baulichen Abnahme weiß er exakt, wo die sicherheitsrelevanten Details in der praktischen Umsetzung liegen.",
    },
    {
      name: "Sebastian Lang",
      title: "Präzision in Maschinenbau, Qualitätssicherung und Produkttest",
      image: "/ueberuns/sebastian-lang.jpeg",
      body: "Sebastian steht für höchste technische Genauigkeit und industrielle Standards. Als Feinwerker im Maschinenbau mit umfassender Expertise in der Qualitätssicherung und technischen Abnahme – unter anderem geprägt durch seine anspruchsvolle Tätigkeit bei der Kinshofer GmbH – kennt er die Bedeutung von fehlerfreien Prozessen bis ins kleinste Detail. Sein ausgeprägtes technisches Verständnis garantiert, dass die Prüfkriterien und Produkttests des DPI den höchsten qualitativen und mechanischen Anforderungen des Marktes vollumfänglich gerecht werden.",
    },
  ];

  return (
    <main className="bg-white text-gray-900">

      {/* Hero */}
      <section data-animate="section" className="relative overflow-hidden border-b border-gray-200 bg-[#ececec] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:items-start lg:gap-14">
            <div className="lg:mt-20 lg:flex lg:h-[335px] lg:flex-col lg:justify-between">
              <span className="mb-4 block text-sm font-semibold uppercase tracking-[0.24em] text-[#1E6091]">Unternehmen</span>
              <h1 className="max-w-[24ch] text-4xl font-bold leading-[1.08] text-brand-text sm:text-5xl">
                Über uns – Das Deutsche Prüfsiegel Institut (DPI)
              </h1>
              <h2 className="mt-4 text-lg font-semibold text-slate-600">
                Unsere Vision: Aussagekräftige Produkt- und Dienstleistungstests aus der Praxis, für die Praxis
              </h2>
            </div>
            <div className="relative h-[250px] w-full overflow-hidden rounded-[3rem] border border-[#9ebde3] bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.65)] sm:h-[290px] lg:mt-20 lg:h-[335px]">
              <Image
                src="/ueberuns/vision-regalgang.jpeg"
                alt="Regalgang mit Produkten"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
          <p className="mt-7 text-[clamp(1rem,1.02vw,1.12rem)] leading-[1.7] text-slate-600 lg:mt-10 lg:max-w-none">
            Hinter dem Deutschen Prüfsiegel Institut (DPI) stehen wir – die im oberbayerischen Tegernsee geborenen Brüder Ferdinand und Sebastian Lang. Als dynamisches Unternehmen haben wir es uns zur Aufgabe gemacht, Prüfsiegel und Zertifizierungen transparent, verständlich und vor allem realitätsnah zu gestalten. Wir sind der festen Überzeugung: Ein professioneller Produkttest ist nur dann wirklich wertvoll, wenn er den alltäglichen Bedingungen und dem tatsächlichen Kundennutzen entspricht.
          </p>
        </div>
      </section>

      {/* Vision */}
      <section data-animate="section" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/75 p-8 shadow-[0_22px_70px_-42px_rgba(15,23,42,0.35)] sm:p-10">
            <span className="text-brand-green text-xs uppercase tracking-widest block font-semibold">Unsere Vision</span>
            <h3 className="mt-3 text-2xl font-bold text-brand-text sm:text-3xl">
              Von der eigenen Idee zur Qualitätssicherung im E-Commerce
            </h3>
            <p className="mt-4 max-w-5xl text-base text-gray-600 leading-8 sm:text-lg">
              Unser Antrieb für das DPI entstand aus unmittelbarer, eigener Erfahrung. Wir haben selbst Artikel von der ersten Zeichnung bis zur Marktreife entwickelt und erfolgreich auf Plattformen wie Amazon verkauft. Dabei ist uns ein massives Problem bewusst geworden: Der deutsche Markt wird zunehmend mit minderwertigen Billigprodukten überflutet. Genau hier bringen wir Licht ins Dunkel. Unser Ziel ist es, dass sich herausragende Seller auf Marktplätzen wie Amazon, Otto oder eBay durch unser Siegel deutlich von der Masse abheben. Wer viel Herzblut in seine Artikel steckt, soll durch einen unabhängigen DPI-Produkttest auf den ersten Blick als vertrauenswürdig erkannt werden und für echte Qualität stehen.
            </p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section data-animate="section" className="border-t border-gray-200 py-16 sm:py-20" style={{ backgroundColor: "#f3f4f6" }}>
        <div className="mx-auto max-w-6xl px-6">
          <span className="text-brand-green text-xs uppercase tracking-widest block font-semibold">Qualitätsanspruch</span>
          <h2 className="mt-3 text-3xl font-bold text-brand-text sm:text-4xl">
            Unsere Struktur: Höchste Standards und qualifizierte Prüfer
          </h2>
          <p className="mt-4 max-w-5xl text-base text-gray-600 leading-8 sm:text-lg">
            Als Gründer sind wir, Ferdinand und Sebastian Lang, die Köpfe und fachlichen Leiter hinter den verschiedenen Abteilungen des Deutschen Prüfsiegel Instituts. Um eine breite Palette an Kategorien professionell abdecken zu können, beschäftigen wir ein starkes Team aus spezialisierten Prüfern in den unterschiedlichsten Bereichen. Jeder unserer Mitarbeiter wird intensiv nach unseren strengen DPI-Standards geschult, um praxisnahe und objektive Bewertungen zu garantieren. Dabei überlassen wir nichts dem Zufall: Bevor ein Prüfsiegel unser Haus verlässt, durchläuft es eine finale Qualitätskontrolle durch uns. Wir werfen den letzten, entscheidenden Blick auf jeden Bericht und garantieren so, dass unsere hohen Ansprüche an Professionalität bei jeder Zertifizierung gewahrt bleiben.
          </p>

          <div className="mt-12 grid gap-8">
            {team.map((member, idx) => (
              <article key={member.name} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
                <div className="grid items-start gap-8 md:grid-cols-2 md:gap-10">
                  <div className={idx % 2 === 0 ? "order-1" : "order-1 md:order-2"}>
                    <h3 className="text-2xl font-bold text-brand-text sm:text-[1.7rem]">{member.name} – {member.title}</h3>
                    <p className="mt-4 text-base text-gray-600 leading-8 sm:text-lg">{member.body}</p>
                  </div>
                  <div className={idx % 2 === 0 ? "order-2" : "order-2 md:order-1"}>
                    <div className="relative mx-auto aspect-[3/4] w-full max-w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-lg ring-1 ring-slate-200/60">
                      <Image src={member.image} alt={member.name} fill className="object-cover" />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Why DPI */}
      <section data-animate="section" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-12">
            <div>
              <span className="text-brand-green text-xs uppercase tracking-widest block font-semibold">Warum DPI?</span>
              <h2 className="mt-3 text-3xl font-bold text-brand-text sm:text-4xl">
                Warum DPI? Unser Versprechen an Seller und Verbraucher
              </h2>
              <p className="mt-4 max-w-3xl text-base text-gray-600 leading-8 sm:text-lg">
                Wir kommen aus der Praxis und genau so prüfen wir auch. Wir bewerten nicht nach rein theoretischen Labormaßstäben, sondern mit dem unbestechlichen Blick aus der echten Welt. Das Deutsche Prüfsiegel Institut steht für Bewertungen, die exakt das widerspiegeln, was für den Endkunden am Ende zählt: Funktion, Sicherheit und Qualität im realen Einsatz. Egal ob fundierter Produkttest für Amazon und Otto oder normgerechte Spielplatzprüfung nach DIN – mit unserer Erfahrung, unserem qualifizierten Prüfer-Team und absoluter Bodenhaftung schaffen wir Prüfsiegel, auf die sich ehrliche Händler und anspruchsvolle Verbraucher gleichermaßen verlassen können.
              </p>
            </div>
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-gray-200 bg-gray-100 shadow-xl ring-1 ring-slate-200/60">
              <Image
                src="/ueberuns/technologie-pruefprozess.jpeg"
                alt="Technologischer Prüfprozess"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
