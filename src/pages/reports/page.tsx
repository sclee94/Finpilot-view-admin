import { useState, useMemo } from 'react';
import PageLayout from '../../components/PageLayout';
import TradeDetailModal from './components/TradeDetailModal';
import Pagination from '../../components/Pagination';
import FilterButtonGroup from '../../components/FilterButtonGroup';
import DateTripleFilter, { type DateFilter, INIT_DATE } from './components/DateTripleFilter';
import TradeSummaryCards from './components/TradeSummaryCards';
import TradeTable from './components/TradeTable';
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

const PAGE_SIZE = 10;

type SortField = 'applyDate' | 'confirmDate' | 'no' | null;
type SortDir = 'asc' | 'desc';

function toDateParts(dt: string | null) {
  if (!dt) return { year: '', month: '', day: '' };
  const [y, m, d] = dt.slice(0, 10).split('-');
  return { year: y, month: m, day: d };
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
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const base = MOCK_TRADES.filter(t => {
      const ap = toDateParts(t.applyDate);
      const cp = toDateParts(t.confirmDate);
      return (
        (statusFilter === 'all' || t.status === statusFilter) &&
        (typeFilter === 'all' || t.tradeType === typeFilter) &&
        (marketFilter === 'all' || t.market === marketFilter) &&
        (applyDate.year === 'all' || ap.year === applyDate.year) &&
        (applyDate.month === 'all' || ap.month === applyDate.month) &&
        (applyDate.day === 'all' || ap.day === applyDate.day) &&
        (confirmDate.year === 'all' || cp.year === confirmDate.year) &&
        (confirmDate.month === 'all' || cp.month === confirmDate.month) &&
        (confirmDate.day === 'all' || cp.day === confirmDate.day) &&
        (search === '' || t.stockName.includes(search) || t.author.includes(search))
      );
    });

    if (sortField) {
      base.sort((a, b) => {
        if (sortField === 'no') return sortDir === 'asc' ? a.no - b.no : b.no - a.no;
        const cmp = (a[sortField] ?? '').localeCompare(b[sortField] ?? '');
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return base;
  }, [statusFilter, typeFilter, marketFilter, applyDate, confirmDate, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const summary = useMemo(() => {
    const total     = filtered.length;
    const settled   = filtered.filter(t => t.status === '체결').length;
    const pending   = filtered.filter(t => t.status === '대기').length;
    const totalTradeAmt = filtered.reduce((s, t) => s + t.totalAmount, 0);
    const totalBuyAmt   = filtered.filter(t => t.tradeType === '매수').reduce((s, t) => s + t.totalAmount, 0);
    const totalSellAmt  = filtered.filter(t => t.tradeType === '매도').reduce((s, t) => s + t.totalAmount, 0);
    const settledAmt    = filtered.filter(t => t.status === '체결').reduce((s, t) => s + t.totalAmount, 0);
    const profit = filtered.filter(t => t.status === '체결' && t.tradeType === '매도').reduce((s, t) => s + t.totalAmount, 0)
                 - filtered.filter(t => t.status === '체결' && t.tradeType === '매수').reduce((s, t) => s + t.totalAmount, 0);
    return { total, settled, pending, totalTradeAmt, totalBuyAmt, totalSellAmt, settledAmt, profit };
  }, [filtered]);

  return (
    <PageLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-white mb-0.5">거래현황</h1>
          <p className="text-xs text-zinc-400">거래 게시판 — 전체 매수·매도 내역을 확인합니다</p>
        </div>

        <TradeSummaryCards summary={summary} filtered={filtered} />

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <FilterButtonGroup options={STATUS_FILTERS} value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} />
            <FilterButtonGroup options={TYPE_FILTERS} value={typeFilter} onChange={v => { setTypeFilter(v); setPage(1); }} />
            <FilterButtonGroup options={MARKET_FILTERS} value={marketFilter} onChange={v => { setMarketFilter(v); setPage(1); }} />
            <span className="text-sm text-zinc-500 whitespace-nowrap">총 {filtered.length}건</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DateTripleFilter label="신청날짜" field="applyDate" value={applyDate} onChange={v => { setApplyDate(v); setPage(1); }} />
            <DateTripleFilter label="확정날짜" field="confirmDate" value={confirmDate} onChange={v => { setConfirmDate(v); setPage(1); }} />
            <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex-1 min-w-[200px]">
              <i className="ri-search-line text-zinc-500 text-lg mr-2.5"></i>
              <input
                type="text" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="종목명, 작성자..."
                className="bg-transparent text-base text-zinc-200 placeholder-zinc-600 focus:outline-none w-full"
              />
            </div>
          </div>
        </div>

        <TradeTable
          paginated={paginated}
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSortToggle}
          onRowClick={setSelectedTrade}
        />

        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>

      <TradeDetailModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} />
    </PageLayout>
  );
}
