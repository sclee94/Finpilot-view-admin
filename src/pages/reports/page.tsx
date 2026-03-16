import { useState, useMemo } from 'react';
import PageLayout from '../../components/PageLayout';
import TradeDetailModal from './components/TradeDetailModal';
import SelectDropdown from '../../components/SelectDropdown';
import Pagination from '../../components/Pagination';
import { MOCK_TRADES } from '../../mocks/trades';
import type { Trade } from '../../types';

const STATUS_FILTERS = [
  { id: 'all', label: '전체' },
  { id: '체결', label: '체결' },
  { id: '대기', label: '대기' },
  { id: '취소', label: '취소' },
];

const TYPE_FILTERS = [
  { id: 'all', label: '전체' },
  { id: '매수', label: '매수' },
  { id: '매도', label: '매도' },
];

const MARKET_FILTERS = [
  { id: 'all', label: '전체' },
  { id: '코스피', label: '코스피' },
  { id: '코스닥', label: '코스닥' },
  { id: '나스닥', label: '나스닥' },
];

const MARKET_STYLE: Record<string, string> = {
  '코스피': 'bg-sky-500/15 text-sky-400',
  '코스닥': 'bg-violet-500/15 text-violet-400',
  '나스닥': 'bg-orange-500/15 text-orange-400',
};

const PAGE_SIZE = 10;

type SortField = 'applyDate' | 'confirmDate' | 'no' | null;
type SortDir = 'asc' | 'desc';

interface DateFilter {
  year: string;
  month: string;
  day: string;
}

const INIT_DATE: DateFilter = { year: 'all', month: 'all', day: 'all' };

function formatAmt(amt: number): string {
  const abs = Math.abs(amt);
  if (abs >= 100000000) return `${(amt / 100000000).toFixed(2)}억`;
  if (abs >= 10000) return `${(amt / 10000).toFixed(0)}만`;
  return `₩${amt.toLocaleString()}`;
}

function toDateParts(dt: string | null): { year: string; month: string; day: string } {
  if (!dt) return { year: '', month: '', day: '' };
  const [y, m, d] = dt.slice(0, 10).split('-');
  return { year: y, month: m, day: d };
}

function getUniqueYears(field: 'applyDate' | 'confirmDate'): string[] {
  const set = new Set<string>();
  MOCK_TRADES.forEach((t) => {
    const { year } = toDateParts(t[field]);
    if (year) set.add(year);
  });
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

function getUniqueMonths(field: 'applyDate' | 'confirmDate', year: string): string[] {
  const set = new Set<string>();
  MOCK_TRADES.forEach((t) => {
    const { year: y, month } = toDateParts(t[field]);
    if (y === year && month) set.add(month);
  });
  return Array.from(set).sort();
}

function getUniqueDays(field: 'applyDate' | 'confirmDate', year: string, month: string): string[] {
  const set = new Set<string>();
  MOCK_TRADES.forEach((t) => {
    const { year: y, month: m, day } = toDateParts(t[field]);
    if (y === year && m === month && day) set.add(day);
  });
  return Array.from(set).sort();
}

interface DateTripleFilterProps {
  label: string;
  field: 'applyDate' | 'confirmDate';
  value: DateFilter;
  onChange: (value: DateFilter) => void;
}

function DateTripleFilter({ label, field, value, onChange }: DateTripleFilterProps) {
  const { year, month, day } = value;

  const years = useMemo(() => [
    { value: 'all', label: '전체' },
    ...getUniqueYears(field).map((y) => ({ value: y, label: `${y}년` })),
  ], [field]);

  const months = useMemo(() => [
    { value: 'all', label: '전체' },
    ...(year !== 'all' ? getUniqueMonths(field, year).map((m) => ({ value: m, label: `${parseInt(m)}월` })) : []),
  ], [field, year]);

  const days = useMemo(() => [
    { value: 'all', label: '전체' },
    ...(year !== 'all' && month !== 'all' ? getUniqueDays(field, year, month).map((d) => ({ value: d, label: `${parseInt(d)}일` })) : []),
  ], [field, year, month]);

  return (
    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
      <i className="ri-calendar-line text-zinc-500 text-lg"></i>
      <span className="text-base text-zinc-400 mr-1 font-medium">{label}</span>
      <SelectDropdown label="" value={year} options={years} onChange={(v) => onChange(v === 'all' ? INIT_DATE : { year: v, month: 'all', day: 'all' })} />
      <SelectDropdown label="" value={month} options={months} onChange={(v) => onChange(v === 'all' ? { ...value, month: 'all', day: 'all' } : { ...value, month: v })} disabled={year === 'all'} />
      <SelectDropdown label="" value={day} options={days} onChange={(v) => onChange({ ...value, day: v })} disabled={year === 'all' || month === 'all'} />
    </div>
  );
}

export default function ReportsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [marketFilter, setMarketFilter] = useState('all');
  const [applyDate, setApplyDate] = useState<DateFilter>(INIT_DATE);
  const [confirmDate, setConfirmDate] = useState<DateFilter>(INIT_DATE);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const base = MOCK_TRADES.filter((t) => {
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchType = typeFilter === 'all' || t.tradeType === typeFilter;
      const matchMarket = marketFilter === 'all' || t.market === marketFilter;

      const ap = toDateParts(t.applyDate);
      const matchApply =
        (applyDate.year === 'all' || ap.year === applyDate.year) &&
        (applyDate.month === 'all' || ap.month === applyDate.month) &&
        (applyDate.day === 'all' || ap.day === applyDate.day);

      const cp = toDateParts(t.confirmDate);
      const matchConfirm =
        (confirmDate.year === 'all' || cp.year === confirmDate.year) &&
        (confirmDate.month === 'all' || cp.month === confirmDate.month) &&
        (confirmDate.day === 'all' || cp.day === confirmDate.day);

      const matchSearch =
        search === '' ||
        t.stockName.includes(search) ||
        t.author.includes(search);

      return matchStatus && matchType && matchMarket && matchApply && matchConfirm && matchSearch;
    });

    if (sortField) {
      base.sort((a, b) => {
        if (sortField === 'no') {
          const cmp = a.no - b.no;
          return sortDir === 'asc' ? cmp : -cmp;
        }
        const aVal = a[sortField] ?? '';
        const bVal = b[sortField] ?? '';
        const cmp = aVal.localeCompare(bVal);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return base;
  }, [statusFilter, typeFilter, marketFilter, applyDate, confirmDate, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 요약 카드: 필터링된 결과 기반으로 동적 계산
  const summary = useMemo(() => {
    const total = filtered.length;
    const settled = filtered.filter((t) => t.status === '체결').length;
    const pending = filtered.filter((t) => t.status === '대기').length;

    // 전체 매매 금액 (전체 거래 totalAmount 합산)
    const totalTradeAmt = filtered.reduce((s, t) => s + t.totalAmount, 0);
    // 총 매수 금액 (매수 거래 totalAmount 합산)
    const totalBuyAmt = filtered.filter((t) => t.tradeType === '매수').reduce((s, t) => s + t.totalAmount, 0);
    // 총 매도 금액 (매도 거래 totalAmount 합산)
    const totalSellAmt = filtered.filter((t) => t.tradeType === '매도').reduce((s, t) => s + t.totalAmount, 0);
    // 체결 총액 (체결된 거래 totalAmount 합산)
    const settledAmt = filtered.filter((t) => t.status === '체결').reduce((s, t) => s + t.totalAmount, 0);
    // 총 수익 (매도 체결 - 매수 체결)
    const sellSettledAmt = filtered.filter((t) => t.status === '체결' && t.tradeType === '매도').reduce((s, t) => s + t.totalAmount, 0);
    const buySettledAmt = filtered.filter((t) => t.status === '체결' && t.tradeType === '매수').reduce((s, t) => s + t.totalAmount, 0);
    const profit = sellSettledAmt - buySettledAmt;

    return { total, settled, pending, totalTradeAmt, totalBuyAmt, totalSellAmt, settledAmt, profit };
  }, [filtered]);

  return (
    <PageLayout>
      <div className="space-y-4">
        {/* 헤더 */}
        <div>
          <h1 className="text-xl font-bold text-white mb-0.5">거래현황</h1>
          <p className="text-xs text-zinc-400">거래 게시판 — 전체 매수·매도 내역을 확인합니다</p>
        </div>

        {/* 요약 카드 */}
        <div className="flex gap-4 items-stretch">
          {/* 앞 3개 카드 */}
          <div className="flex flex-col gap-3 flex-shrink-0 self-stretch">
            {[
              { label: '전체 거래', value: `${summary.total}건`, icon: 'ri-list-check-2', color: 'text-zinc-300', bg: 'bg-zinc-800/60' },
              { label: '체결 완료', value: `${summary.settled}건`, icon: 'ri-checkbox-circle-line', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: '대기 중', value: `${summary.pending}건`, icon: 'ri-time-line', color: 'text-amber-400', bg: 'bg-amber-500/10' },
            ].map((card) => (
              <div key={card.label} className={`${card.bg} border border-zinc-800 rounded-xl px-6 py-4 flex items-center gap-4 w-56 flex-1 min-h-0`}>
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-zinc-800 shrink-0">
                  <i className={`${card.icon} text-2xl ${card.color}`}></i>
                </div>
                <div>
                  <p className="text-base text-zinc-500 leading-tight">{card.label}</p>
                  <p className={`text-3xl font-bold ${card.color} mt-1`}>{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 전체 총액 큰 카드 */}
          <div className="flex-1 bg-teal-500/10 border border-teal-500/30 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-teal-500/20 shrink-0">
                <i className="ri-money-dollar-circle-line text-lg text-teal-400"></i>
              </div>
              <span className="text-lg font-bold text-teal-300 tracking-wide">전체 총액</span>
            </div>

            <div className="flex gap-3 flex-1">
              {/* 왼쪽: 총 체결 수익 (전체 높이) */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center items-center w-56 shrink-0 gap-3">
                <div className="flex items-center gap-2">
                  <i className={`${summary.profit >= 0 ? 'ri-arrow-up-circle-line text-sky-400' : 'ri-arrow-down-circle-line text-rose-400'} text-lg`}></i>
                  <span className="text-base text-zinc-500">총 체결 수익</span>
                </div>
                <div className="text-center">
                  <p className={`text-3xl font-bold ${summary.profit >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                    {summary.profit >= 0 ? '+' : ''}₩{formatAmt(summary.profit)}
                  </p>
                  <p className="text-sm text-zinc-600 mt-1.5">매도 체결 - 매수 체결</p>
                </div>
              </div>

              {/* 오른쪽 2x2 그리드 */}
              <div className="grid grid-cols-2 gap-3 flex-1">
                {/* 총 체결 매수 금액 */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-arrow-down-circle-line text-teal-400 text-lg"></i>
                    <span className="text-base text-zinc-500">총 체결 매수 금액</span>
                  </div>
                  <p className="text-2xl font-bold text-teal-400">₩{formatAmt(summary.totalBuyAmt)}</p>
                  <p className="text-sm text-zinc-600 mt-1.5">{filtered.filter((t) => t.tradeType === '매수').length}건 합산</p>
                </div>

                {/* 총 매매 금액 */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-exchange-line text-zinc-400 text-lg"></i>
                    <span className="text-base text-zinc-500">총 매매 금액</span>
                  </div>
                  <p className="text-2xl font-bold text-zinc-100">₩{formatAmt(summary.totalTradeAmt)}</p>
                  <p className="text-sm text-zinc-600 mt-1.5">{filtered.length}건 합산</p>
                </div>

                {/* 총 체결 매도 금액 */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-arrow-up-circle-line text-rose-400 text-lg"></i>
                    <span className="text-base text-zinc-500">총 체결 매도 금액</span>
                  </div>
                  <p className="text-2xl font-bold text-rose-400">₩{formatAmt(summary.totalSellAmt)}</p>
                  <p className="text-sm text-zinc-600 mt-1.5">{filtered.filter((t) => t.tradeType === '매도').length}건 합산</p>
                </div>

                {/* 체결 총액 */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-checkbox-circle-line text-emerald-400 text-lg"></i>
                    <span className="text-base text-zinc-500">체결 총액</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">₩{formatAmt(summary.settledAmt)}</p>
                  <p className="text-sm text-zinc-600 mt-1.5">{summary.settled}건 체결</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 + 검색 */}
        <div className="space-y-4">
          {/* 1행: 상태/유형/시장 필터 */}
          <div className="flex flex-wrap items-center gap-3">
            {/* 상태 필터 */}
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setStatusFilter(f.id); setPage(1); }}
                  className={`px-5 py-2.5 rounded-lg text-base font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-teal-500 text-zinc-950'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* 유형 필터 */}
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2">
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setTypeFilter(f.id); setPage(1); }}
                  className={`px-5 py-2.5 rounded-lg text-base font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    typeFilter === f.id
                      ? 'bg-teal-500 text-zinc-950'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* 시장 필터 */}
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2">
              {MARKET_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setMarketFilter(f.id); setPage(1); }}
                  className={`px-5 py-2.5 rounded-lg text-base font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    marketFilter === f.id
                      ? 'bg-teal-500 text-zinc-950'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-base text-zinc-500 whitespace-nowrap">총 {filtered.length}건</span>
          </div>

          {/* 2행: 신청날짜 + 확정날짜 + 검색창 */}
          <div className="flex items-center gap-4">
            <DateTripleFilter
              label="신청날짜"
              field="applyDate"
              value={applyDate}
              onChange={(v) => { setApplyDate(v); setPage(1); }}
            />

            <div className="w-px h-8 bg-zinc-700"></div>

            <DateTripleFilter
              label="확정날짜"
              field="confirmDate"
              value={confirmDate}
              onChange={(v) => { setConfirmDate(v); setPage(1); }}
            />

            <div className="w-px h-8 bg-zinc-700"></div>

            {/* 검색창 */}
            <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              <i className="ri-search-line text-zinc-500 text-lg mr-2.5"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="종목명, 작성자..."
                className="bg-transparent text-base text-zinc-200 placeholder-zinc-600 focus:outline-none w-52"
              />
            </div>
          </div>
        </div>

        {/* 게시판 테이블 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {/* 테이블 헤더 */}
          <div className="grid grid-cols-[40px_1.8fr_0.8fr_0.9fr_0.7fr_1.1fr_0.7fr_1.3fr_0.7fr_1.4fr_1.4fr] text-xs font-semibold text-zinc-500 uppercase tracking-wide px-4 py-3 border-b border-zinc-800 bg-zinc-800/40">
            <button
              onClick={() => handleSortToggle('no')}
              className="flex items-center justify-center gap-0.5 cursor-pointer hover:text-teal-400 transition-colors whitespace-nowrap"
            >
              No
              <span className="flex flex-col leading-none">
                <i className={`ri-arrow-up-s-line text-xs leading-none ${sortField === 'no' && sortDir === 'asc' ? 'text-teal-400' : 'text-zinc-600'}`}></i>
                <i className={`ri-arrow-down-s-line text-xs leading-none ${sortField === 'no' && sortDir === 'desc' ? 'text-teal-400' : 'text-zinc-600'}`}></i>
              </span>
            </button>
            <span>종목</span>
            <span className="text-center">시장</span>
            <span className="text-center">작성자</span>
            <span className="text-center">유형</span>
            <span className="text-right">단가</span>
            <span className="text-right">수량</span>
            <span className="text-right">총 거래금액</span>
            <span className="text-center">상태</span>
            <button
              onClick={() => handleSortToggle('applyDate')}
              className="flex items-center justify-center gap-1 cursor-pointer hover:text-teal-400 transition-colors whitespace-nowrap"
            >
              신청날짜
              <span className="flex flex-col leading-none">
                <i className={`ri-arrow-up-s-line text-xs leading-none ${sortField === 'applyDate' && sortDir === 'asc' ? 'text-teal-400' : 'text-zinc-600'}`}></i>
                <i className={`ri-arrow-down-s-line text-xs leading-none ${sortField === 'applyDate' && sortDir === 'desc' ? 'text-teal-400' : 'text-zinc-600'}`}></i>
              </span>
            </button>
            <button
              onClick={() => handleSortToggle('confirmDate')}
              className="flex items-center justify-center gap-1 cursor-pointer hover:text-teal-400 transition-colors whitespace-nowrap"
            >
              확정날짜
              <span className="flex flex-col leading-none">
                <i className={`ri-arrow-up-s-line text-xs leading-none ${sortField === 'confirmDate' && sortDir === 'asc' ? 'text-teal-400' : 'text-zinc-600'}`}></i>
                <i className={`ri-arrow-down-s-line text-xs leading-none ${sortField === 'confirmDate' && sortDir === 'desc' ? 'text-teal-400' : 'text-zinc-600'}`}></i>
              </span>
            </button>
          </div>

          {/* 행 */}
          {paginated.length === 0 ? (
            <div className="py-16 text-center text-zinc-600 text-sm">
              <i className="ri-inbox-line text-3xl mb-2 block"></i>
              검색 결과가 없습니다
            </div>
          ) : (
            paginated.map((trade, idx) => (
              <div
                key={trade.id}
                onClick={() => setSelectedTrade(trade)}
                className={`grid grid-cols-[40px_1.8fr_0.8fr_0.9fr_0.7fr_1.1fr_0.7fr_1.3fr_0.7fr_1.4fr_1.4fr] items-center px-4 py-3.5 cursor-pointer hover:bg-zinc-800/60 transition-colors ${
                  idx !== paginated.length - 1 ? 'border-b border-zinc-800/70' : ''
                }`}
              >
                <span className="text-center text-xs text-zinc-600">{trade.no}</span>

                <div className="min-w-0 pr-4">
                  <p className="text-sm font-medium text-zinc-100 truncate hover:text-teal-400 transition-colors">
                    {trade.stockName}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">{trade.stockCode}</p>
                </div>

                <div className="flex justify-center">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${MARKET_STYLE[trade.market] ?? 'bg-zinc-700 text-zinc-400'}`}>
                    {trade.market}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-1.5">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-teal-500/20 shrink-0">
                    <i className="ri-user-line text-teal-400 text-xs"></i>
                  </div>
                  <span className="text-xs text-zinc-300 truncate">{trade.author}</span>
                </div>

                <div className="flex justify-center">
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                    trade.tradeType === '매수'
                      ? 'bg-teal-500/15 text-teal-400'
                      : 'bg-rose-500/15 text-rose-400'
                  }`}>
                    {trade.tradeType}
                  </span>
                </div>

                <span className="text-right text-xs text-zinc-300">
                  ₩{trade.price.toLocaleString()}
                </span>

                <span className="text-right text-xs font-semibold text-zinc-200">
                  {trade.quantity.toLocaleString()}주
                </span>

                <span className="text-right text-xs font-semibold text-amber-400">
                  ₩{trade.totalAmount.toLocaleString()}
                </span>

                <div className="flex justify-center">
                  <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                    trade.status === '체결' ? 'bg-emerald-500/15 text-emerald-400' :
                    trade.status === '대기' ? 'bg-amber-500/15 text-amber-400' :
                    'bg-zinc-700 text-zinc-500'
                  }`}>
                    {trade.status}
                  </span>
                </div>

                <div className="text-center">
                  <p className="text-xs text-zinc-300">{trade.applyDate.slice(0, 10)}</p>
                  <p className="text-xs text-zinc-300 mt-0.5">{trade.applyDate.slice(11)}</p>
                </div>

                <div className="text-center">
                  {trade.confirmDate ? (
                    <>
                      <p className="text-xs text-zinc-300">{trade.confirmDate.slice(0, 10)}</p>
                      <p className="text-xs text-zinc-300 mt-0.5">{trade.confirmDate.slice(11)}</p>
                    </>
                  ) : (
                    <span className="text-xs text-zinc-600">—</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      <TradeDetailModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
    </PageLayout>
  );
}
