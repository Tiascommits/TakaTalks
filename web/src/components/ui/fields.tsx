"use client";

import { useId, useState } from "react";

const FOCUS_RING =
  "focus:outline-none focus:border-green focus:ring-2 focus:ring-green/30";

function formatDisplay(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "";
  return n.toLocaleString("en-IN");
}

export function NumberField({
  label,
  value,
  onChange,
  currency = true,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  /** Show the ৳ affix and lakh/crore comma grouping. Off for plain counts (e.g. number of children). */
  currency?: boolean;
}) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");

  // While focused, show the raw text the user is typing (formatting
  // mid-keystroke would fight their cursor). Once blurred, fall back to a
  // formatted view derived straight from the controlled `value` prop.
  const displayValue = focused ? text : currency ? formatDisplay(value) : value ? String(value) : "";

  function handleChange(raw: string) {
    const cleaned = raw.replace(/[^\d.]/g, "");
    setText(cleaned);
    const n = parseFloat(cleaned);
    onChange(Number.isFinite(n) ? n : 0);
  }

  return (
    <div className="mb-1">
      <label htmlFor={id} className="block text-xs text-[#555] mb-1">
        {label}
      </label>
      <div className="relative">
        {currency && (
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted">
            ৳
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={displayValue}
          placeholder="0"
          onFocus={() => {
            setText(value ? String(value) : "");
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          onChange={(e) => handleChange(e.target.value)}
          className={`w-full ${currency ? "pl-6" : "pl-2.5"} pr-2.5 py-2 border border-line bg-[#FCFBF8] text-sm text-ink ${FOCUS_RING}`}
        />
      </div>
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
  const id = useId();
  return (
    <div className="flex items-center gap-2 text-sm text-[#444] mt-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`w-auto ${FOCUS_RING}`}
      />
      <label htmlFor={id}>{label}</label>
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
  const id = useId();
  return (
    <div className="mb-1">
      <label htmlFor={id} className="block text-xs text-[#555] mb-1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-2.5 py-2 border border-line bg-[#FCFBF8] text-sm text-ink ${FOCUS_RING}`}
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
