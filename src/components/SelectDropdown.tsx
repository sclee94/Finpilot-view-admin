import { useState, useEffect, useRef } from 'react';

interface SelectDropdownProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}

export default function SelectDropdown({ label, value, options, onChange, disabled }: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`flex items-center gap-2 px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-base transition-colors whitespace-nowrap ${
          disabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-teal-500 cursor-pointer'
        } ${value !== 'all' ? 'text-teal-400 font-semibold border-teal-500/50' : 'text-zinc-400'}`}
      >
        <span className="text-zinc-500">{label}</span>
        <span>{selected?.label ?? '전체'}</span>
        <i className={`ri-arrow-down-s-line text-zinc-500 text-lg transition-transform ${open ? 'rotate-180' : ''}`}></i>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-30 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl min-w-[120px] overflow-hidden max-h-56 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-5 py-3 text-base hover:bg-zinc-800 transition-colors cursor-pointer ${
                value === opt.value ? 'text-teal-400 font-semibold' : 'text-zinc-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
