import { MOCK_TRADES } from '../../../mocks/trades';

const STATUS_STYLE: Record<string, string> = {
  '체결': 'bg-emerald-500/15 text-emerald-400',
  '대기': 'bg-amber-500/15 text-amber-400',
  '취소': 'bg-zinc-700 text-zinc-400',
};

const TYPE_STYLE: Record<string, string> = {
  '매수': 'bg-teal-500/15 text-teal-400',
  '매도': 'bg-rose-500/15 text-rose-400',
};

const MARKET_STYLE: Record<string, string> = {
  '코스피': 'text-sky-400',
  '코스닥': 'text-violet-400',
  '나스닥': 'text-orange-400',
};

export default function RecentTrades() {
  const trades = MOCK_TRADES.slice(0, 6);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-100">최근 거래 현황</h3>
        <a href="/reports" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
          전체 보기
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-5 py-3 text-zinc-500 font-medium">종목명</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">작성자</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">시장</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">유형</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium">단가</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium">수량</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium">총 거래금액</th>
              <th className="text-center px-4 py-3 text-zinc-500 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, i) => (
              <tr
                key={trade.id}
                className={`border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors ${
                  i === trades.length - 1 ? 'border-b-0' : ''
                }`}
              >
                <td className="px-5 py-3">
                  <p className="text-zinc-200 font-medium">{trade.stockName}</p>
                  <p className="text-zinc-500 mt-0.5">{trade.stockCode}</p>
                </td>
                <td className="px-4 py-3 text-zinc-300">{trade.author}</td>
                <td className={`px-4 py-3 font-medium ${MARKET_STYLE[trade.market] ?? 'text-zinc-400'}`}>
                  {trade.market}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full font-bold ${TYPE_STYLE[trade.tradeType]}`}>
                    {trade.tradeType}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-zinc-300 font-mono">
                  ₩{trade.price.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right text-zinc-300 font-mono">
                  {trade.quantity.toLocaleString()}주
                </td>
                <td className="px-4 py-3 text-right text-amber-400 font-mono font-bold">
                  ₩{trade.totalAmount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[trade.status] ?? 'bg-zinc-700 text-zinc-400'}`}>
                    {trade.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
