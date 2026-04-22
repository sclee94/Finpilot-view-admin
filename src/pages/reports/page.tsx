import { useState, useMemo, useEffect } from 'react';
import PageLayout from '../../components/PageLayout';
import TradeDetailModal from './components/TradeDetailModal';
import Pagination from '../../components/Pagination';
import FilterButtonGroup from '../../components/FilterButtonGroup';
import TradeSummaryCards from './components/TradeSummaryCards';
import TradeTable from './components/TradeTable';
import { getTradeHistoryList } from '../../api/tradeApi';
import { authStorage } from '../../utils/auth';
import type { TradeHistory } from '../../types';

const MODE_FILTERS = [
  { id: 'all',   label: '전체' },
  { id: 'LIVE',  label: '실전' },
  { id: 'PAPER', label: '모의' },
];

const ACTION_FILTERS = [
  { id: 'all',         label: '전체' },
  { id: 'BUY',         label: '매수' },
  { id: 'SELL_SHORT',  label: '공매도' },
  { id: 'CLOSE_LONG',  label: '청산(롱)' },
  { id: 'CLOSE_SHORT', label: '청산(숏)' },
];

const STATUS_FILTERS = [
  { id: 'all',     label: '전체' },
  { id: 'SUCCESS', label: '성공' },
  { id: 'FAILED',  label: '실패' },
];

const PAGE_SIZE = 15;

type SortField = 'createdAt' | 'entryAt' | 'exitAt' | 'realizedPnl' | null;
type SortDir = 'asc' | 'desc';

const today = new Date().toISOString().slice(0, 10);

export default function ReportsPage() {
  const user    = authStorage.get();
  const isAdmin = (user?.permission ?? 0) >= 99;

  const [list,        setList]        = useState<TradeHistory[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [modeFilter,  setModeFilter]  = useState('all');
  const [actionFilter,setActionFilter]= useState('all');
  const [statusFilter,setStatusFilter]= useState('all');
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(1);
  const [selected,    setSelected]    = useState<TradeHistory | null>(null);
  const [sortField,   setSortField]   = useState<SortField>(null);
  const [sortDir,     setSortDir]     = useState<SortDir>('desc');
  const [dateFrom,    setDateFrom]    = useState(today);
  const [dateTo,      setDateTo]      = useState(today);

  useEffect(() => {
    setLoading(true);
    const params = isAdmin ? {} : { userUid: user?.userUid ?? null };
    getTradeHistoryList(params)
      .then(res => {
        if (res.status === 200) setList(res.data ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const base = list.filter(t => {
      const q = search.toLowerCase();
      const dateStr = t.createdAt?.slice(0, 10) ?? '';
      return (
        (modeFilter   === 'all' || t.mode        === modeFilter) &&
        (actionFilter === 'all' || t.action      === actionFilter) &&
        (statusFilter === 'all' || t.orderStatus === statusFilter) &&
        (q === '' || t.symbol.toLowerCase().includes(q) || (t.symbolName ?? '').toLowerCase().includes(q)) &&
        (dateFrom === '' || dateStr >= dateFrom) &&
        (dateTo   === '' || dateStr <= dateTo)
      );
    });

    if (sortField) {
      base.sort((a, b) => {
        let av: string | number | null, bv: string | number | null;
        if (sortField === 'realizedPnl') {
          av = a.realizedPnl; bv = b.realizedPnl;
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          return sortDir === 'asc' ? av - bv : bv - av;
        }
        av = a[sortField] ?? ''; bv = b[sortField] ?? '';
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return base;
  }, [list, modeFilter, actionFilter, statusFilter, search, sortField, sortDir, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <PageLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-white mb-0.5">거래현황</h1>
          <p className="text-xs text-zinc-400">
            {isAdmin ? '전체 유저 거래 이력' : '내 거래 이력'} — 매수·매도·청산 내역을 확인합니다
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-zinc-500 text-sm">
            <i className="ri-loader-4-line text-3xl animate-spin mb-2 block"></i>
            불러오는 중...
          </div>
        ) : (
          <>
            <TradeSummaryCards list={filtered} />

            <div className="space-y-3">
              {/* 날짜 범위 */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                    className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-teal-500 [color-scheme:dark]"
                  />
                </div>
                <span className="text-zinc-500 text-sm">~</span>
                <div className="relative">
                  <input
                    type="date"
                    value={dateTo}
                    onChange={e => { setDateTo(e.target.value); setPage(1); }}
                    className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-teal-500 [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* 필터 버튼 */}
              <div className="flex flex-wrap items-center gap-2">
                <FilterButtonGroup options={MODE_FILTERS}   value={modeFilter}   onChange={v => { setModeFilter(v);   setPage(1); }} />
                <FilterButtonGroup options={ACTION_FILTERS} value={actionFilter} onChange={v => { setActionFilter(v); setPage(1); }} />
                <FilterButtonGroup options={STATUS_FILTERS} value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} />
                <span className="text-sm text-zinc-500 whitespace-nowrap">총 {filtered.length}건</span>
              </div>

              {/* 검색 */}
              <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 max-w-sm">
                <i className="ri-search-line text-zinc-500 text-lg mr-2.5"></i>
                <input
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="종목명, 종목코드..."
                  className="bg-transparent text-base text-zinc-200 placeholder-zinc-600 focus:outline-none w-full"
                />
              </div>
            </div>

            <TradeTable
              paginated={paginated}
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              onRowClick={setSelected}
            />

            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            )}
          </>
        )}
      </div>

      <TradeDetailModal trade={selected} onClose={() => setSelected(null)} />
    </PageLayout>
  );
}
