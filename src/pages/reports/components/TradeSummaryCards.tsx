import type { TradeHistory } from '../../../types';
import type { AssetSummary } from '../../../api/tradeApi';

function formatPnl(val: number): string {
  const abs = Math.abs(val);
  const sign = val >= 0 ? '+' : '-';
  if (abs >= 100000000) return `${sign}${(abs / 100000000).toFixed(2)}억`;
  return `${sign}₩${abs.toLocaleString()}`;
}

function formatAmt(val: number): string {
  return `₩${val.toLocaleString()}`;
}

interface Props {
  list: TradeHistory[];
  assetInfo?: AssetSummary | null;
}

export default function TradeSummaryCards({ list, assetInfo }: Props) {
  const total        = list.length;
  const success      = list.filter(t => t.orderStatus === 'SUCCESS').length;
  const failed       = list.filter(t => t.orderStatus === 'FAILED').length;
  const closeList    = list.filter(t => t.action === 'CLOSE_LONG' || t.action === 'CLOSE_SHORT');
  const buyList      = list.filter(t => t.action === 'BUY' || t.action === 'ADD_LONG');
  const totalPnl     = closeList.reduce((s, t) => s + (t.realizedPnl ?? 0), 0);
  const buyCount     = buyList.length;
  const closeCount   = closeList.length;
  const totalBuyAmt  = buyList.reduce((s, t) => s + (t.entryPrice != null ? t.entryPrice * t.shares : 0), 0);
  const totalSellAmt = closeList.reduce((s, t) => s + (t.exitPrice != null ? t.exitPrice * t.shares : 0), 0);

  return (
    <div className="flex flex-col xl:flex-row gap-4">
      {/* 왼쪽 카드 3개 */}
      <div className="flex flex-row sm:flex-col xl:flex-col gap-3 xl:w-52 xl:shrink-0">
        {[
          { label: '전체 거래', value: `${total}건`,   icon: 'ri-list-check-2',         color: 'text-zinc-300',   bg: 'bg-zinc-800/60' },
          { label: '성공',      value: `${success}건`, icon: 'ri-checkbox-circle-line',  color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: '실패',      value: `${failed}건`,  icon: 'ri-error-warning-line',    color: 'text-rose-400',    bg: 'bg-rose-500/10' },
        ].map(card => (
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

      {/* 오른쪽 요약 패널 */}
      <div className="flex-1 bg-teal-500/10 border border-teal-500/30 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-teal-500/20 shrink-0">
            <i className="ri-bar-chart-line text-base text-teal-400"></i>
          </div>
          <span className="text-base font-bold text-teal-300 tracking-wide">거래 요약</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* 실현 손익 */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center items-center sm:w-44 xl:w-48 sm:shrink-0 gap-2">
            <div className="flex items-center gap-2">
              <i className={`${totalPnl >= 0 ? 'ri-arrow-up-circle-line text-sky-400' : 'ri-arrow-down-circle-line text-rose-400'} text-base`}></i>
              <span className="text-sm text-zinc-500">총 실현 손익</span>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                {formatPnl(totalPnl)}
              </p>
              <p className="text-xs text-zinc-600 mt-1">청산 {closeCount}건 합산</p>
            </div>
          </div>

          {/* 액션별 카운트 */}
          <div className="flex flex-col gap-3 flex-1">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <i className="ri-arrow-down-circle-line text-teal-400 text-sm"></i>
                <span className="text-xs text-zinc-500">매수 (BUY+ADD)</span>
              </div>
              <p className="text-lg font-bold text-teal-400">{buyCount}건</p>
              <p className="text-xs text-teal-600 mt-0.5">{formatAmt(totalBuyAmt)}</p>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <i className="ri-check-double-line text-sky-400 text-sm"></i>
                <span className="text-xs text-zinc-500">청산 (CLOSE)</span>
              </div>
              <p className="text-lg font-bold text-sky-400">{closeCount}건</p>
              <p className="text-xs text-sky-600 mt-0.5">{formatAmt(totalSellAmt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 우측 현재 자산 패널 */}
      <div className="xl:w-64 xl:shrink-0 bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 sm:p-5 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-500/20 shrink-0">
            <i className="ri-wallet-3-line text-base text-indigo-400"></i>
          </div>
          <span className="text-base font-bold text-indigo-300 tracking-wide">현재 자산</span>
        </div>

        <div className="flex flex-col gap-3 flex-1">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <i className="ri-funds-line text-indigo-400 text-sm"></i>
              <span className="text-xs text-zinc-500">총자산</span>
            </div>
            <p className="text-lg font-bold text-indigo-300">
              {assetInfo != null ? formatAmt(assetInfo.totalAsset) : '—'}
            </p>
            <p className="text-xs text-zinc-600 mt-0.5">보유주식 + 현금</p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <i className="ri-stock-line text-amber-400 text-sm"></i>
              <span className="text-xs text-zinc-500">보유 주식 평가금액</span>
            </div>
            <p className="text-lg font-bold text-amber-300">
              {assetInfo != null ? formatAmt(assetInfo.stockEvalAmount) : '—'}
            </p>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <i className="ri-money-dollar-circle-line text-emerald-400 text-sm"></i>
              <span className="text-xs text-zinc-500">매수 가능 자산</span>
            </div>
            <p className="text-lg font-bold text-emerald-300">
              {assetInfo != null ? formatAmt(assetInfo.availableBuyAmount) : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
