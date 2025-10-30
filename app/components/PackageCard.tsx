"use client";

export function PackageCard({
  title,
  price,
  subtitle,
  onSelect,
}: {
  title: string;
  price: string;
  subtitle: string;
  onSelect: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="text-sm uppercase text-gray-500">{title}</div>
      <div className="text-3xl font-semibold mt-1">{price}</div>
      <p className="text-sm text-gray-600 mt-3">{subtitle}</p>
      <button
        onClick={onSelect}
        className="mt-6 inline-block rounded-2xl bg-amber-500 text-white px-4 py-2"
      >
        Auswählen
      </button>
    </div>
  );
}
