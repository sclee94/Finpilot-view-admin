import type { Trade } from '../../../types';
import { MARKET_STYLE, TRADE_STATUS_STYLE, TRADE_TYPE_STYLE } from '../../../constants/tradeStyles';

type SortField = 'applyDate' | 'confirmDate' | 'no' | null;
type SortDir = 'asc' | 'desc';

interface Props {
  paginated: Trade[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  onRowClick: (trade: Trade) => void;
}

function SortIcon({ field, activeField, dir }: { field: SortField; activeField: SortField; dir: SortDir }) {
  return (
    <span className="flex flex-col leading-none">
      <i className={`ri-arrow-up-s-line text-xs leading-none ${activeField === field && dir === 'asc' ? 'text-teal-400' : 'text-zinc-600'}`}></i>
      <i className={`ri-arrow-down-s-line text-xs leading-none ${activeField === field && dir === 'desc' ? 'text-teal-400' : 'text-zinc-600'}`}></i>
    </span>
  );
}

const COL = 'grid-cols-[40px_1.8fr_0.8fr_0.9fr_0.7fr_1.1fr_0.7fr_1.3fr_0.7fr_1.4fr_1.4fr]';

export default function TradeTable({ paginated, sortField, sortDir, onSort, onRowClick }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto">
      <div className={`grid ${COL} text-xs font-semibold text-zinc-500 uppercase tracking-wide px-4 py-3 border-b border-zinc-800 bg-zinc-800/40`}>
        <button onClick={() => onSort('no')}
          className="flex items-center justify-center gap-0.5 cursor-pointer hover:text-teal-400 transition-colors whitespace-nowrap">
          No <SortIcon field="no" activeField={sortField} dir={sortDir} />
        </button>
        <span>종목</span>
        <span className="text-center">시장</span>
        <span className="text-center">작성자</span>
        <span className="text-center">유형</span>
        <span className="text-right">단가</span>
        <span className="text-right">수량</span>
        <span className="text-right">총 거래금액</span>
        <span className="text-center">상태</span>
        <button onClick={() => onSort('applyDate')}
          className="flex items-center justify-center gap-1 cursor-pointer hover:text-teal-400 transition-colors whitespace-nowrap">
          신청날짜 <SortIcon field="applyDate" activeField={sortField} dir={sortDir} />
        </button>
        <button onClick={() => onSort('confirmDate')}
          className="flex items-center justify-center gap-1 cursor-pointer hover:text-teal-400 transition-colors whitespace-nowrap">
          확정날짜 <SortIcon field="confirmDate" activeField={sortField} dir={sortDir} />
        </button>
      </div>

      {paginated.length === 0 ? (
        <div className="py-16 text-center text-zinc-600 text-sm">
          <i className="ri-inbox-line text-3xl mb-2 block"></i>
          검색 결과가 없습니다
        </div>
      ) : (
        paginated.map((trade, idx) => (
          <div
            key={trade.id}
            onClick={() => onRowClick(trade)}
            className={`grid ${COL} items-center px-4 py-3.5 cursor-pointer hover:bg-zinc-800/60 transition-colors ${
              idx !== paginated.length - 1 ? 'border-b border-zinc-800/70' : ''
            }`}
          >
            <span className="text-center text-xs text-zinc-600">{trade.no}</span>
            <div className="min-w-0 pr-4">
              <p className="text-sm font-medium text-zinc-100 truncate hover:text-teal-400 transition-colors">{trade.stockName}</p>
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
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${TRADE_TYPE_STYLE[trade.tradeType] ?? 'bg-zinc-700 text-zinc-400'}`}>
                {trade.tradeType}
              </span>
            </div>
            <span className="text-right text-xs text-zinc-300">₩{trade.price.toLocaleString()}</span>
            <span className="text-right text-xs font-semibold text-zinc-200">{trade.quantity.toLocaleString()}주</span>
            <span className="text-right text-xs font-semibold text-amber-400">₩{trade.totalAmount.toLocaleString()}</span>
            <div className="flex justify-center">
              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${TRADE_STATUS_STYLE[trade.status] ?? 'bg-zinc-700 text-zinc-500'}`}>
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
  );
}
