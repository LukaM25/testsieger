"use client";

import { useState } from "react";

export default function FooterClient() {
  const [modal, setModal] = useState<"impressum" | "kontakt" | "datenschutz" | null>(null);

  return (
    <>
      <footer className="mt-16 border-t border-gray-200/70 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-gray-600">
          <div className="border-t border-gray-200/60 w-[90%] mx-auto mb-6"></div>

          <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-4 text-center md:text-left">
            <div className="text-gray-500">
              © {new Date().getFullYear()} Prüfsiegel Zentrum UG. Alle Rechte vorbehalten.
            </div>
            <div className="flex gap-6 text-gray-700 font-medium">
              <button onClick={() => setModal("impressum")} className="hover:text-[#0a74da] transition">
                Impressum
              </button>
              <button onClick={() => setModal("kontakt")} className="hover:text-[#0a74da] transition">
                Kontakt
              </button>
              <button onClick={() => setModal("datenschutz")} className="hover:text-[#0a74da] transition">
                Datenschutz
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Overlay Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-fade-in"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-[90%] max-h-[85vh] overflow-y-auto shadow-2xl p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModal(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
            >
              ✕
            </button>

            {/* Impressum */}
            {modal === "impressum" && (
              <>
                <h2 className="text-2xl font-semibold text-[#2e4053] mb-4">Impressum</h2>
                <p>Prüfsiegel Zentrum UG (haftungsbeschränkt)</p>
                <p>Musterstraße 12, 6020 Innsbruck, Österreich</p>
                <p>Vertreten durch: Luka Matanic</p>
                <p className="mt-3">
                  E-Mail:{" "}
                  <a
                    href="mailto:testdomain2501@mail2germany.com"
                    className="text-[#0a74da] hover:underline"
                  >
                    testdomain2501@mail2germany.com
                  </a>
                </p>
                <p className="mt-6 text-sm text-gray-500">
                  Verantwortlich gemäß § 55 Abs. 2 RStV: Luka Matanic
                </p>
              </>
            )}

            {/* Kontakt */}
            {modal === "kontakt" && (
              <>
                <h2 className="text-2xl font-semibold text-[#2e4053] mb-4">Kontakt</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    await fetch("/api/contact", { method: "POST", body: formData });
                    alert("Nachricht gesendet!");
                    setModal(null);
                  }}
                  className="mt-4 grid gap-3"
                >
                  <input
                    name="name"
                    required
                    placeholder="Ihr Name"
                    className="border rounded px-3 py-2"
                  />
                  <input
                    name="email"
                    required
                    type="email"
                    placeholder="Ihre E-Mail-Adresse"
                    className="border rounded px-3 py-2"
                  />
                  <textarea
                    name="message"
                    required
                    rows={4}
                    placeholder="Ihre Nachricht"
                    className="border rounded px-3 py-2"
                  />
                  <button className="rounded-xl bg-amber-500 text-white px-4 py-2 hover:bg-amber-600 transition">
                    Senden
                  </button>
                </form>
              </>
            )}

            {/* Datenschutz */}
            {modal === "datenschutz" && (
              <>
                <h2 className="text-2xl font-semibold text-[#2e4053] mb-4">
                  Datenschutzerklärung
                </h2>
                <p>
                  Wir verarbeiten Ihre Daten ausschließlich auf Grundlage der DSGVO und
                  des TKG. Ihre Daten werden nicht ohne Ihre Zustimmung weitergegeben.
                </p>
                <p className="mt-3">
                  Ihre Rechte: Auskunft, Berichtigung, Löschung, Einschränkung,
                  Widerspruch und Datenübertragbarkeit.
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  Kontakt Datenschutz:{" "}
                  <a
                    href="mailto:testdomain2501@mail2germany.com"
                    className="text-[#0a74da] hover:underline"
                  >
                    testdomain2501@mail2germany.com
                  </a>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
