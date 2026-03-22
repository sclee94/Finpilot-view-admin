import { useMemo } from 'react';
import SelectDropdown from '../../../components/SelectDropdown';
import { MOCK_TRADES } from '../../../mocks/trades';

export interface DateFilter {
  year: string;
  month: string;
  day: string;
}

export const INIT_DATE: DateFilter = { year: 'all', month: 'all', day: 'all' };

function toDateParts(dt: string | null) {
  if (!dt) return { year: '', month: '', day: '' };
  const [y, m, d] = dt.slice(0, 10).split('-');
  return { year: y, month: m, day: d };
}

function getUniqueYears(field: 'applyDate' | 'confirmDate'): string[] {
  const set = new Set<string>();
  MOCK_TRADES.forEach(t => { const { year } = toDateParts(t[field]); if (year) set.add(year); });
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

function getUniqueMonths(field: 'applyDate' | 'confirmDate', year: string): string[] {
  const set = new Set<string>();
  MOCK_TRADES.forEach(t => { const { year: y, month } = toDateParts(t[field]); if (y === year && month) set.add(month); });
  return Array.from(set).sort();
}

function getUniqueDays(field: 'applyDate' | 'confirmDate', year: string, month: string): string[] {
  const set = new Set<string>();
  MOCK_TRADES.forEach(t => { const { year: y, month: m, day } = toDateParts(t[field]); if (y === year && m === month && day) set.add(day); });
  return Array.from(set).sort();
}

interface Props {
  label: string;
  field: 'applyDate' | 'confirmDate';
  value: DateFilter;
  onChange: (value: DateFilter) => void;
}

export default function DateTripleFilter({ label, field, value, onChange }: Props) {
  const { year, month, day } = value;

  const years = useMemo(() => [
    { value: 'all', label: '전체' },
    ...getUniqueYears(field).map(y => ({ value: y, label: `${y}년` })),
  ], [field]);

  const months = useMemo(() => [
    { value: 'all', label: '전체' },
    ...(year !== 'all' ? getUniqueMonths(field, year).map(m => ({ value: m, label: `${parseInt(m)}월` })) : []),
  ], [field, year]);

  const days = useMemo(() => [
    { value: 'all', label: '전체' },
    ...(year !== 'all' && month !== 'all' ? getUniqueDays(field, year, month).map(d => ({ value: d, label: `${parseInt(d)}일` })) : []),
  ], [field, year, month]);

  return (
    <div className="flex flex-wrap items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2">
      <i className="ri-calendar-line text-zinc-500 text-base"></i>
      <span className="text-sm text-zinc-400 font-medium">{label}</span>
      <SelectDropdown label="" value={year} options={years} onChange={v => onChange(v === 'all' ? INIT_DATE : { year: v, month: 'all', day: 'all' })} />
      <SelectDropdown label="" value={month} options={months} onChange={v => onChange(v === 'all' ? { ...value, month: 'all', day: 'all' } : { ...value, month: v })} disabled={year === 'all'} />
      <SelectDropdown label="" value={day} options={days} onChange={v => onChange({ ...value, day: v })} disabled={year === 'all' || month === 'all'} />
    </div>
  );
}
