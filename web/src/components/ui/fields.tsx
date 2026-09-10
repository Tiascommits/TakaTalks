"use client";

export function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mb-1">
      <label className="block text-xs text-[#555] mb-1">{label}</label>
      <input
        type="number"
        min={0}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm text-ink focus:outline-none focus:border-green"
      />
    </div>
  );
}

export function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-[#444] mt-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-auto"
      />
      <label>{label}</label>
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="mb-1">
      <label className="block text-xs text-[#555] mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm text-ink focus:outline-none focus:border-green"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Fieldset({
  legend,
  note,
  children,
}: {
  legend: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border border-line bg-card px-4 pt-4 pb-4.5">
      <legend className="font-serif font-semibold text-[15.5px] text-green-deep px-1.5">
        {legend}
      </legend>
      {note && <p className="text-xs text-muted mt-0.5 mb-2.5">{note}</p>}
      {children}
    </fieldset>
  );
}
