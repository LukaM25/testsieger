export function PackageCard({
  title,
  price,
  subtitle,
  onSelect,
  disabled = false,
  disabledLabel,
  onDisabledClick,
}: {
  title: string;
  price: string;
  subtitle: string;
  onSelect: () => void;
  disabled?: boolean;
  disabledLabel?: string;
  onDisabledClick?: () => void;
}) {
  const handleClick = () => {
    if (disabled) {
      onDisabledClick?.();
      return;
    }
    onSelect();
  };

  return (
    <div className="card space-y-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-2xl font-bold">{price}</p>
      <p className="text-sm text-neutral-600">{subtitle}</p>
      <button
        className={`btn btn-primary ${disabled ? 'bg-gray-200 text-slate-500 cursor-not-allowed' : ''}`}
        onClick={handleClick}
        disabled={disabled}
        title={disabled ? disabledLabel : undefined}
      >
        {disabled ? disabledLabel || 'Auswählen' : 'Auswählen'}
      </button>
    </div>
  );
}
