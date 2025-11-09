"use client";

export function PackageCard({
  title,
  price,
  subtitle,
  onSelectAction,
}: {
  title: string;
  price: string;
  subtitle: string;
  onSelectAction: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="text-sm uppercase text-gray-500">{title}</div>
      <div className="text-3xl font-semibold mt-1">{price}</div>
      <p className="text-sm text-gray-600 mt-3">{subtitle}</p>
      <button
        onClick={onSelectAction}
        className="mt-6 inline-block rounded-2xl bg-blue-900 text-white px-4 py-2"
      >
        Auswählen
      </button>
    </div>
  );
}
