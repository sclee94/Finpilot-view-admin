interface FilterOption {
  id: string;
  label: string;
}

interface FilterButtonGroupProps {
  options: FilterOption[];
  value: string;
  onChange: (id: string) => void;
}

export default function FilterButtonGroup({ options, value, onChange }: FilterButtonGroupProps) {
  return (
    <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1.5">
      {options.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
            value === f.id
              ? 'bg-teal-500 text-zinc-950'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
