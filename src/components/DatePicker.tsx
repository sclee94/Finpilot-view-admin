import { useState, useRef, useEffect } from 'react';

interface DatePickerProps {
  value: string;               // 'YYYY-MM-DD'
  onChange: (date: string) => void;
  className?: string;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// new Date(string) 파싱은 UTC 기준이라 브라우저 로컬 타임존에 따라 하루가 밀릴 수 있어
// 연/월/일을 직접 분해해서 로컬 Date를 만든다.
function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function formatISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 날짜 선택 팝업 캘린더 — 월 이동은 팝업이 유지되고, 일을 클릭했을 때만 닫히면서 값이 적용된다.
 * (네이티브 input[type=date]는 이 동작을 코드로 제어할 수 없어 직접 구현) */
export default function DatePicker({ value, onChange, className = '' }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseISO(value || formatISO(new Date())));
  const containerRef = useRef<HTMLDivElement>(null);

  // 팝업을 열 때마다 현재 선택된 값이 있는 달로 뷰를 맞춘다.
  useEffect(() => {
    if (open) setViewDate(parseISO(value || formatISO(new Date())));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-based

  const startOffset  = new Date(year, month, 1).getDay(); // 0=일요일
  const daysInMonth  = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selected = value ? parseISO(value) : null;
  const isSelectedDay = (day: number) =>
    !!selected && selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;

  const now = new Date();
  const isToday = (day: number) =>
    now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;

  const handlePickDay = (day: number) => {
    onChange(formatISO(new Date(year, month, day)));
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-3 py-2 cursor-pointer hover:border-zinc-600 focus:outline-none focus:border-teal-500 transition-colors"
      >
        <i className="ri-calendar-line text-zinc-500"></i>
        {value || 'YYYY-MM-DD'}
      </button>

      {open && (
        <div className="absolute z-20 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-xl w-64">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"
            >
              <i className="ri-arrow-left-s-line"></i>
            </button>
            <span className="text-sm font-semibold text-zinc-200">{year}년 {month + 1}월</span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"
            >
              <i className="ri-arrow-right-s-line"></i>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map(w => (
              <div key={w} className="text-center text-[11px] text-zinc-500 py-1">{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => (
              <button
                key={idx}
                type="button"
                disabled={day === null}
                onClick={() => day !== null && handlePickDay(day)}
                className={`h-7 text-xs rounded-md cursor-pointer transition-colors ${
                  day === null
                    ? 'invisible'
                    : isSelectedDay(day)
                    ? 'bg-teal-500 text-white font-semibold'
                    : isToday(day)
                    ? 'text-teal-400 border border-teal-500/40 hover:bg-zinc-800'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
