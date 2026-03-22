import { memo } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchInput = memo(function SearchInput({
  value,
  onChange,
  placeholder = '검색...',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
      />
    </div>
  );
});

export default SearchInput;
