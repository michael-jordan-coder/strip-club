"use client";

type Option<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type Props<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({ value, options, onChange }: Props<T>) {
  return (
    <div className="inline-flex rounded-lg bg-zinc-950/50 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={opt.disabled}
          onClick={() => onChange(opt.value)}
          className={`rounded-[7px] px-3 py-1.5 text-[13px] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-30 ${
            value === opt.value
              ? "bg-zinc-700/70 text-zinc-100"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
