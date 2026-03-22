import { type SelectHTMLAttributes } from 'react';

type FilterSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export default function FilterSelect({ className = '', ...props }: FilterSelectProps) {
  return (
    <select
      className={`px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${className}`}
      {...props}
    />
  );
}
