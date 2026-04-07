import type { NumVal } from '../strategyTypes';

export function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-zinc-800 bg-zinc-800/40 rounded-t-xl">
        <i className={`${icon} text-teal-400 text-xl`}></i>
        <h2 className="text-lg font-semibold text-zinc-200">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function FieldLabel({ label, desc, extra }: { label: string; desc: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-lg font-medium text-zinc-300">{label}</span>
      {extra}
      <span className="relative group/tip">
        <i className="ri-information-line text-zinc-400 hover:text-teal-400 text-base cursor-help transition-colors"></i>
        <span className="absolute bottom-full left-0 mb-2 w-max px-4 py-3 bg-zinc-700 border border-zinc-600 text-zinc-100 text-lg rounded-lg shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-[200] whitespace-nowrap leading-relaxed">
          {desc}
          <span className="absolute top-full left-4 border-4 border-transparent border-t-zinc-700"></span>
        </span>
      </span>
    </div>
  );
}

export function NumberField({ label, desc, value, step, min, max, isInt, onChange, labelExtra }: {
  label: string; desc: string; value: NumVal; step: number; min?: number; max?: number; isInt?: boolean;
  onChange: (v: NumVal) => void; labelExtra?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel label={label} desc={desc} extra={labelExtra} />
      <input
        type="number" value={value} step={step} min={min} max={max}
        placeholder="값을 입력하세요"
        onChange={e => {
          const raw = e.target.value;
          if (raw === '') { onChange(''); return; }
          const parsed = isInt ? parseInt(raw) : parseFloat(raw);
          if (!isNaN(parsed)) onChange(parsed);
        }}
        className="w-full px-3 py-2.5 border rounded-lg text-lg text-zinc-200 focus:outline-none transition-colors bg-zinc-800 border-zinc-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-zinc-600"
      />
    </div>
  );
}

export function ReadOnlyNumberField({ label, desc, value }: { label: string; desc: string; value: number | '' }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel label={label} desc={desc} />
      <input
        type="number" value={value} readOnly
        className="w-full px-3 py-2.5 border rounded-lg text-lg text-zinc-400 bg-zinc-800/50 border-zinc-700/50 cursor-default focus:outline-none"
      />
    </div>
  );
}

export function SelectField({ label, desc, value, options, readOnly, withPlaceholder, onChange }: {
  label: string; desc: string; value: string;
  options: { value: string; label: string; group?: string }[];
  readOnly?: boolean; withPlaceholder?: boolean;
  onChange: (v: string) => void;
}) {
  const hasGroups = options.some(o => o.group);
  const grouped = hasGroups
    ? options.reduce<Record<string, typeof options>>((acc, o) => {
        const g = o.group ?? '';
        (acc[g] ??= []).push(o);
        return acc;
      }, {})
    : null;

  return (
    <div className="space-y-1.5">
      {label && <FieldLabel label={label} desc={desc} />}
      <select value={value} disabled={readOnly} onChange={e => onChange(e.target.value)}
        className={`w-full px-3 py-2.5 border rounded-lg text-lg focus:outline-none transition-colors ${readOnly ? 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 cursor-default' : 'bg-zinc-800 border-zinc-700 text-zinc-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent'}`}>
        {withPlaceholder && <option value="" disabled>— 종목을 선택하세요 —</option>}
        {grouped
          ? Object.entries(grouped).map(([g, opts]) => (
              <optgroup key={g} label={g}>
                {opts.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </optgroup>
            ))
          : options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
        }
      </select>
    </div>
  );
}

export function ToggleField({ label, desc, value, readOnly, onChange }: {
  label: string; desc: string; value: boolean; readOnly?: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
      <FieldLabel label={label} desc={desc} />
      <button type="button" disabled={readOnly} onClick={() => !readOnly && onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${value ? 'bg-teal-500' : 'bg-zinc-600'} ${readOnly ? 'cursor-default opacity-70' : 'cursor-pointer'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

export function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-1.5 text-base font-medium rounded-md transition-colors cursor-pointer ${active ? 'bg-teal-500 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
      {children}
    </button>
  );
}
