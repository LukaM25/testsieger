
export function PackageCard({ title, price, subtitle, onSelect }: { title: string; price: string; subtitle: string; onSelect: () => void }) {
  return (
    <div className="card space-y-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-2xl font-bold">{price}</p>
      <p className="text-sm text-neutral-600">{subtitle}</p>
      <button className="btn btn-primary" onClick={onSelect}>Auswählen</button>
    </div>
  );
}
