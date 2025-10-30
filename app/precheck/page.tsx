export default function PrecheckPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 pt-20 pb-16">
      <h1 className="text-3xl font-semibold text-[#2e4053]">Pre-Check</h1>
      <p className="text-gray-600 mt-2">Bitte füllen Sie die Daten vollständig aus.</p>

      <form method="post" action="/api/form/submit" className="mt-6 grid gap-3 bg-white border rounded-2xl p-6">
        <div className="grid md:grid-cols-2 gap-3">
          <input name="name" className="border rounded px-3 py-2" placeholder="Vollständiger Name" required />
          <input name="company" className="border rounded px-3 py-2" placeholder="Firma" required />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <input name="email" type="email" className="border rounded px-3 py-2" placeholder="E-Mail" required />
          <input name="address" className="border rounded px-3 py-2" placeholder="Adresse" required />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <input name="productName" className="border rounded px-3 py-2" placeholder="Produktname" required />
          <input name="brandName" className="border rounded px-3 py-2" placeholder="Marke" required />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <input name="sku" className="border rounded px-3 py-2" placeholder="Hersteller-Code / SKU" />
          <input name="dimensions" className="border rounded px-3 py-2" placeholder="Verpackungsmaße" />
        </div>
        <textarea name="specs" className="border rounded px-3 py-2" rows={4} placeholder="Spezifikationen (z. B. wasserdicht, flammhemmend, energiesparend)"></textarea>

        <button className="rounded-2xl bg-amber-500 text-white px-4 py-2">Pre-Check absenden</button>
      </form>
    </div>
  );
}
