export default function KontaktPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-gray-700 leading-relaxed">
      <h1 className="text-3xl font-semibold text-[#2e4053] mb-4">Kontakt</h1>
      <p>
        Haben Sie Fragen zu unseren Prüfsiegeln oder möchten Sie Ihr Produkt für eine Prüfung anmelden?
        Kontaktieren Sie uns gerne über das folgende Formular oder per E-Mail.
      </p>

      <form
        method="post"
        action="/api/contact"
        className="mt-8 grid gap-4 bg-white border rounded-2xl p-6 shadow-sm"
      >
        <input type="text" name="name" required placeholder="Ihr Name" className="border rounded px-3 py-2" />
        <input type="email" name="email" required placeholder="Ihre E-Mail-Adresse" className="border rounded px-3 py-2" />
        <textarea name="message" required rows={5} placeholder="Ihre Nachricht" className="border rounded px-3 py-2" />
        <button className="rounded-2xl bg-amber-500 text-white px-4 py-2">Nachricht senden</button>
      </form>
    </div>
  );
}
