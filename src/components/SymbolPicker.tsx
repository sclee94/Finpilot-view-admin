import { useState, useEffect } from 'react';
import { getSymbolsByCategory, SYMBOL_CATEGORIES, type SymbolCategory } from '../api/symbolApi';
import type { SymbolUniverse } from '../types';

/** 시가총액을 조/억 단위로 축약 표시 (원화·달러 공통 — 자릿수 크기로만 표현) */
function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) return `${(marketCap / 1e12).toFixed(1)}조`;
  if (marketCap >= 1e8) return `${Math.round(marketCap / 1e8).toLocaleString()}억`;
  return marketCap.toLocaleString();
}

interface SymbolPickerProps {
  value: string;
  onChange: (symbol: string) => void;
  disabled?: boolean;
  defaultCategory?: SymbolCategory;
}

/** 카테고리(코스피200/나스닥100/지수) → 종목 2단계 선택 — DB 기반, 현재가 내림차순 정렬 */
export default function SymbolPicker({ value, onChange, disabled = false, defaultCategory = 'KOSPI200' }: SymbolPickerProps) {
  const [category, setCategory] = useState<SymbolCategory>(defaultCategory);
  const [symbols, setSymbols]   = useState<SymbolUniverse[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getSymbolsByCategory(category)
      .then(res => { if (!cancelled) setSymbols(res.data ?? []); })
      .catch(() => { if (!cancelled) setSymbols([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [category]);

  return (
    <div className="space-y-2">
      <div className="flex bg-zinc-800 rounded-md p-0.5 gap-0.5 w-fit">
        {SYMBOL_CATEGORIES.map(c => (
          <button
            key={c.value}
            type="button"
            disabled={disabled}
            onClick={() => { setCategory(c.value); onChange(''); }}
            className={`px-3 py-1 text-xs rounded transition-colors cursor-pointer disabled:cursor-not-allowed ${
              category === c.value ? 'bg-teal-500 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled || loading}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-teal-500 transition-colors disabled:opacity-50"
      >
        <option value="">
          {loading ? '불러오는 중...' : symbols.length === 0 ? '종목 목록이 없습니다' : '— 종목을 선택하세요 —'}
        </option>
        {symbols.map(s => (
          <option key={s.symbol} value={s.symbol}>
            {s.symbolName} ({s.symbol})
            {s.marketCap != null ? ` · 시총 ${formatMarketCap(s.marketCap)}` : ''}
            {s.lastPrice != null ? ` · ${s.lastPrice.toLocaleString()}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
