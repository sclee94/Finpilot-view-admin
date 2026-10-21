import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { TradeHistory } from '../../../types';

interface Props {
  trades: TradeHistory[] | null; // null = 로딩 중
}

const ACTION_STYLE: Record<string, string> = {
  BUY:         'bg-teal-500/15 text-teal-400',
  ADD_LONG:    'bg-blue-500/15 text-blue-400',
  SELL:        'bg-rose-500/15 text-rose-400',
  SELL_SHORT:  'bg-rose-500/15 text-rose-400',
  CLOSE_LONG:  'bg-rose-500/15 text-rose-400',
  CLOSE_SHORT: 'bg-orange-500/15 text-orange-400',
};
const ACTION_LABEL: Record<string, string> = {
  BUY:         '매수',
  ADD_LONG:    '추가매수',
  SELL:        '매도',
  SELL_SHORT:  '공매도',
  CLOSE_LONG:  '청산(롱)',
  CLOSE_SHORT: '청산(숏)',
};
const CATEGORY_LABEL: Record<string, string> = {
  KOSPI200:  '코스피',
  KOSDAQ150: '코스닥',
  NASDAQ100: '나스닥',
};
const CATEGORY_TEXT_STYLE: Record<string, string> = {
  KOSPI200:  'text-sky-400',
  KOSDAQ150: 'text-violet-400',
  NASDAQ100: 'text-orange-400',
};
const STATUS_STYLE: Record<string, string> = {
  SUCCESS: 'bg-emerald-500/15 text-emerald-400',
  FAILED:  'bg-red-500/15 text-red-400',
};

const RecentTrades = memo(function RecentTrades({ trades }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-100">최근 거래 현황</h3>
        <Link to="/reports" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
          전체 보기
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-5 py-3 text-zinc-500 font-medium">종목명</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">사용자</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">시장</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">유형</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium">단가</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium">수량</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium">총 거래금액</th>
              <th className="text-center px-4 py-3 text-zinc-500 font-medium">상태</th>
              <th className="text-right px-5 py-3 text-zinc-500 font-medium">일시</th>
            </tr>
          </thead>
          <tbody>
            {trades === null || trades.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-zinc-500">
                  {trades === null ? '불러오는 중...' : '거래 내역이 없습니다'}
                </td>
              </tr>
            ) : (
              trades.map((trade, i) => {
                // 진입 건은 진입가, 청산 건은 청산가가 체결 기준가
                const price = trade.entryPrice ?? trade.exitPrice;
                const currency = trade.category === 'NASDAQ100' ? '$' : '₩';
                return (
                  <tr
                    key={trade.id}
                    className={`border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors ${
                      i === trades.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="px-5 py-3">
                      <p className="text-zinc-200 font-medium">{trade.symbolName ?? trade.symbol}</p>
                      <p className="text-zinc-500 mt-0.5">{trade.symbol}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {trade.userName ?? '—'}
                      <span className={`ml-1.5 ${trade.mode === 'LIVE' ? 'text-amber-400' : 'text-blue-400'}`}>
                        {trade.mode === 'LIVE' ? '실전' : '모의'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-medium ${(trade.category && CATEGORY_TEXT_STYLE[trade.category]) ?? 'text-zinc-400'}`}>
                      {(trade.category && CATEGORY_LABEL[trade.category]) ?? trade.category ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${ACTION_STYLE[trade.action] ?? 'bg-zinc-700 text-zinc-400'}`}>
                        {ACTION_LABEL[trade.action] ?? trade.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300 font-mono">
                      {price != null ? `${currency}${price.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300 font-mono">
                      {trade.shares.toLocaleString()}주
                    </td>
                    <td className="px-4 py-3 text-right text-amber-400 font-mono font-bold">
                      {price != null ? `${currency}${(price * trade.shares).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[trade.orderStatus] ?? 'bg-zinc-700 text-zinc-400'}`}
                        title={trade.errorMessage ?? undefined}
                      >
                        {trade.orderStatus === 'SUCCESS' ? '체결' : '실패'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-500 whitespace-nowrap">
                      {trade.createdAt.slice(5, 16)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default RecentTrades;
