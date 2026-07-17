// Sélection multiple sobre (puces cochables) — ex. affectation d'automates.

export interface Option {
  value: string;
  label: string;
}

export function SelectMulti({
  options,
  selection,
  onChange,
}: {
  options: Option[];
  selection: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (v: string) => {
    onChange(selection.includes(v) ? selection.filter((x) => x !== v) : [...selection, v]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selection.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={
              'rounded-full border px-3 py-1 text-xs transition ' +
              (on
                ? 'border-terracotta bg-terracotta/10 text-terracotta font-medium'
                : 'border-brume bg-surface text-encre/80 hover:border-marine/40')
            }
          >
            {o.label}
          </button>
        );
      })}
      {options.length === 0 && <span className="text-xs text-encre/50">Aucun automate au référentiel</span>}
    </div>
  );
}
