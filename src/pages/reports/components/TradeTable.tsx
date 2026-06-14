import type { TradeHistory } from '../../../types';

type SortField = 'createdAt' | 'entryAt' | 'exitAt' | 'realizedPnl' | null;
type SortDir = 'asc' | 'desc';

interface Props {
  paginated:  TradeHistory[];
  sortField:  SortField;
  sortDir:    SortDir;
  onSort:     (field: SortField) => void;
  onRowClick: (item: TradeHistory) => void;
}

const ACTION_STYLE: Record<string, string> = {
  BUY:         'bg-teal-500/20 text-teal-300',
  ADD_LONG:    'bg-blue-500/20 text-blue-300',
  SELL_SHORT:  'bg-rose-500/20 text-rose-300',
  CLOSE_LONG:  'bg-sky-500/20 text-sky-300',
  CLOSE_SHORT: 'bg-orange-500/20 text-orange-300',
};
const ACTION_LABEL: Record<string, string> = {
  BUY:         '매수',
  ADD_LONG:    '추가매수',
  SELL_SHORT:  '공매도',
  CLOSE_LONG:  '청산(롱)',
  CLOSE_SHORT: '청산(숏)',
};
const MODE_STYLE: Record<string, string> = {
  LIVE:  'bg-amber-500/20 text-amber-300',
  PAPER: 'bg-blue-500/20 text-blue-300',
};
const STATUS_STYLE: Record<string, string> = {
  SUCCESS: 'bg-emerald-500/20 text-emerald-300',
  FAILED:  'bg-rose-500/20 text-rose-400',
};

// 번호/종목코드/종목명/사용자명/모드/액션/수량/진입가/진입시각/청산가/청산시각/실현손익/상태/생성일시
const COL = 'grid-cols-[36px_80px_110px_100px_68px_90px_70px_95px_115px_95px_115px_105px_70px_115px]';

function SortIcon({ field, active, dir }: { field: SortField; active: SortField; dir: SortDir }) {
  return (
    <span className="flex flex-col leading-none ml-0.5">
      <i className={`ri-arrow-up-s-line text-xs leading-none ${active === field && dir === 'asc' ? 'text-teal-400' : 'text-zinc-600'}`}></i>
      <i className={`ri-arrow-down-s-line text-xs leading-none ${active === field && dir === 'desc' ? 'text-teal-400' : 'text-zinc-600'}`}></i>
    </span>
  );
}

function Dt({ value }: { value: string | null }) {
  if (!value) return <span className="text-zinc-600">—</span>;
  return (
    <div className="text-center">
      <p className="text-xs text-zinc-300">{value.slice(0, 10)}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{value.slice(11, 19)}</p>
    </div>
  );
}

export default function TradeTable({ paginated, sortField, sortDir, onSort, onRowClick }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto">
      {/* 헤더 */}
      <div className={`grid ${COL} text-xs font-semibold text-zinc-500 uppercase tracking-wide px-3 py-3 border-b border-zinc-800 bg-zinc-800/40 min-w-[1280px]`}>
        <span className="text-center">#</span>
        <span>종목코드</span>
        <span>종목명</span>
        <span>사용자명</span>
        <span className="text-center">모드</span>
        <span className="text-center">액션</span>
        <span className="text-right">수량</span>
        <span className="text-right">진입가</span>
        <button onClick={() => onSort('entryAt')} className="flex items-center justify-center gap-0.5 cursor-pointer hover:text-teal-400 transition-colors whitespace-nowrap">
          진입시각 <SortIcon field="entryAt" active={sortField} dir={sortDir} />
        </button>
        <span className="text-right">청산가</span>
        <button onClick={() => onSort('exitAt')} className="flex items-center justify-center gap-0.5 cursor-pointer hover:text-teal-400 transition-colors whitespace-nowrap">
          청산시각 <SortIcon field="exitAt" active={sortField} dir={sortDir} />
        </button>
        <button onClick={() => onSort('realizedPnl')} className="flex items-center justify-end gap-0.5 cursor-pointer hover:text-teal-400 transition-colors whitespace-nowrap">
          실현손익 <SortIcon field="realizedPnl" active={sortField} dir={sortDir} />
        </button>
        <span className="text-center">상태</span>
        <button onClick={() => onSort('createdAt')} className="flex items-center justify-center gap-0.5 cursor-pointer hover:text-teal-400 transition-colors whitespace-nowrap">
          생성일시 <SortIcon field="createdAt" active={sortField} dir={sortDir} />
        </button>
      </div>

      {paginated.length === 0 ? (
        <div className="py-16 text-center text-zinc-600 text-sm min-w-[1280px]">
          <i className="ri-inbox-line text-3xl mb-2 block"></i>
          검색 결과가 없습니다
        </div>
      ) : (
        <div className="min-w-[1280px]">
          {paginated.map((item, idx) => {
            const isClose = item.action === 'CLOSE_LONG' || item.action === 'CLOSE_SHORT';
            const pnlColor = item.realizedPnl != null && item.realizedPnl >= 0 ? 'text-sky-400' : 'text-rose-400';

            return (
              <div
                key={item.id}
                onClick={() => onRowClick(item)}
                className={`grid ${COL} items-center px-3 py-3 cursor-pointer hover:bg-zinc-800/60 transition-colors ${
                  idx !== paginated.length - 1 ? 'border-b border-zinc-800/70' : ''
                }`}
              >
                {/* 번호 */}
                <span className="text-center text-xs text-zinc-600">{idx + 1}</span>

                {/* 종목코드 */}
                <span className="text-xs text-zinc-400 font-mono truncate pr-2">{item.symbol}</span>

                {/* 종목명 */}
                <span className="text-sm font-medium text-zinc-100 truncate pr-2 hover:text-teal-400 transition-colors">
                  {item.symbolName ?? item.symbol}
                </span>

                {/* 사용자명 */}
                <div className="flex items-center gap-1.5 pr-2">
                  <div className="w-5 h-5 flex items-center justify-center rounded-full bg-teal-500/20 shrink-0">
                    <i className="ri-user-line text-teal-400 text-[10px]"></i>
                  </div>
                  <span className="text-xs text-zinc-400 truncate">{item.userName ?? item.userUid?.slice(0, 8) ?? '—'}</span>
                </div>

                {/* 모드 */}
                <div className="flex justify-center">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${MODE_STYLE[item.mode]}`}>
                    {item.mode === 'LIVE' ? '실전' : '모의'}
                  </span>
                </div>

                {/* 액션 */}
                <div className="flex justify-center">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full whitespace-nowrap ${ACTION_STYLE[item.action] ?? 'bg-zinc-700 text-zinc-400'}`}>
                    {ACTION_LABEL[item.action] ?? item.action}
                  </span>
                </div>

                {/* 수량 */}
                <span className="text-right text-xs font-semibold text-zinc-200">{item.shares.toLocaleString()}주</span>

                {/* 진입가 */}
                <span className="text-right text-xs text-zinc-300">
                  {item.entryPrice != null ? `₩${item.entryPrice.toLocaleString()}` : <span className="text-zinc-600">—</span>}
                </span>

                {/* 진입시각 */}
                <Dt value={item.entryAt} />

                {/* 청산가 */}
                <span className="text-right text-xs text-zinc-300">
                  {item.exitPrice != null ? `₩${item.exitPrice.toLocaleString()}` : <span className="text-zinc-600">—</span>}
                </span>

                {/* 청산시각 */}
                <Dt value={item.exitAt} />

                {/* 실현손익 */}
                <span className={`text-right text-xs font-semibold ${isClose && item.realizedPnl != null ? pnlColor : 'text-zinc-600'}`}>
                  {isClose && item.realizedPnl != null
                    ? `${item.realizedPnl >= 0 ? '+' : ''}₩${item.realizedPnl.toLocaleString()}`
                    : '—'}
                </span>

                {/* 상태 */}
                <div className="flex justify-center">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLE[item.orderStatus]}`}>
                    {item.orderStatus === 'SUCCESS' ? '성공' : '실패'}
                  </span>
                </div>

                {/* 생성일시 */}
                <Dt value={item.createdAt} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
