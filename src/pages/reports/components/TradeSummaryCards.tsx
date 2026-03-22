import type { Trade } from '../../../types';

function formatAmt(amt: number): string {
  const abs = Math.abs(amt);
  if (abs >= 100000000) return `${(amt / 100000000).toFixed(2)}억`;
  if (abs >= 10000) return `${(amt / 10000).toFixed(0)}만`;
  return `₩${amt.toLocaleString()}`;
}

interface Summary {
  total: number;
  settled: number;
  pending: number;
  totalTradeAmt: number;
  totalBuyAmt: number;
  totalSellAmt: number;
  settledAmt: number;
  profit: number;
}

interface Props {
  summary: Summary;
  filtered: Trade[];
}

export default function TradeSummaryCards({ summary, filtered }: Props) {
  return (
    <div className="flex flex-col xl:flex-row gap-4">
      <div className="flex flex-row sm:flex-col xl:flex-col gap-3 xl:w-52 xl:shrink-0">
        {[
          { label: '전체 거래', value: `${summary.total}건`, icon: 'ri-list-check-2', color: 'text-zinc-300', bg: 'bg-zinc-800/60' },
          { label: '체결 완료', value: `${summary.settled}건`, icon: 'ri-checkbox-circle-line', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: '대기 중', value: `${summary.pending}건`, icon: 'ri-time-line', color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map((card) => (
          <div key={card.label} className={`${card.bg} border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3 flex-1 xl:flex-none`}>
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800 shrink-0">
              <i className={`${card.icon} text-xl ${card.color}`}></i>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500 leading-tight">{card.label}</p>
              <p className={`text-xl sm:text-2xl font-bold ${card.color} mt-0.5`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 bg-teal-500/10 border border-teal-500/30 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-teal-500/20 shrink-0">
            <i className="ri-money-dollar-circle-line text-base text-teal-400"></i>
          </div>
          <span className="text-base font-bold text-teal-300 tracking-wide">전체 총액</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center items-center sm:w-44 xl:w-48 sm:shrink-0 gap-2">
            <div className="flex items-center gap-2">
              <i className={`${summary.profit >= 0 ? 'ri-arrow-up-circle-line text-sky-400' : 'ri-arrow-down-circle-line text-rose-400'} text-base`}></i>
              <span className="text-sm text-zinc-500">총 체결 수익</span>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${summary.profit >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                {summary.profit >= 0 ? '+' : ''}₩{formatAmt(summary.profit)}
              </p>
              <p className="text-xs text-zinc-600 mt-1">매도 체결 - 매수 체결</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <i className="ri-arrow-down-circle-line text-teal-400 text-sm"></i>
                <span className="text-xs text-zinc-500 truncate">총 체결 매수</span>
              </div>
              <p className="text-lg font-bold text-teal-400">₩{formatAmt(summary.totalBuyAmt)}</p>
              <p className="text-xs text-zinc-600 mt-1">{filtered.filter(t => t.tradeType === '매수').length}건 합산</p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <i className="ri-exchange-line text-zinc-400 text-sm"></i>
                <span className="text-xs text-zinc-500 truncate">총 매매 금액</span>
              </div>
              <p className="text-lg font-bold text-zinc-100">₩{formatAmt(summary.totalTradeAmt)}</p>
              <p className="text-xs text-zinc-600 mt-1">{filtered.length}건 합산</p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <i className="ri-arrow-up-circle-line text-rose-400 text-sm"></i>
                <span className="text-xs text-zinc-500 truncate">총 체결 매도</span>
              </div>
              <p className="text-lg font-bold text-rose-400">₩{formatAmt(summary.totalSellAmt)}</p>
              <p className="text-xs text-zinc-600 mt-1">{filtered.filter(t => t.tradeType === '매도').length}건 합산</p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <i className="ri-checkbox-circle-line text-emerald-400 text-sm"></i>
                <span className="text-xs text-zinc-500 truncate">체결 총액</span>
              </div>
              <p className="text-lg font-bold text-emerald-400">₩{formatAmt(summary.settledAmt)}</p>
              <p className="text-xs text-zinc-600 mt-1">{summary.settled}건 체결</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
