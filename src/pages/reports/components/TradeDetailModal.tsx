import type { TradeHistory } from '../../../types';

interface Props {
  trade:   TradeHistory | null;
  onClose: () => void;
}

const ACTION_STYLE: Record<string, string> = {
  BUY:         'bg-teal-500/20 text-teal-300',
  ADD_LONG:    'bg-blue-500/20 text-blue-300',
  SELL_SHORT:  'bg-rose-500/20 text-rose-300',
  CLOSE_LONG:  'bg-sky-500/20 text-sky-300',
  CLOSE_SHORT: 'bg-orange-500/20 text-orange-300',
};
const ACTION_LABEL: Record<string, string> = {
  BUY:         '매수 (BUY)',
  ADD_LONG:    '추가매수 (ADD_LONG)',
  SELL_SHORT:  '공매도 (SELL_SHORT)',
  CLOSE_LONG:  '청산 롱 (CLOSE_LONG)',
  CLOSE_SHORT: '청산 숏 (CLOSE_SHORT)',
};
const MODE_STYLE: Record<string, string> = {
  LIVE:  'bg-amber-500/20 text-amber-300',
  PAPER: 'bg-blue-500/20 text-blue-300',
};
const STATUS_STYLE: Record<string, string> = {
  SUCCESS: 'bg-emerald-500/20 text-emerald-300',
  FAILED:  'bg-rose-500/20 text-rose-400',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      {children}
    </div>
  );
}

function Dt({ value }: { value: string | null }) {
  if (!value) return <p className="text-xs font-mono text-zinc-600">—</p>;
  return (
    <>
      <p className="text-xs font-mono text-zinc-200">{value.slice(0, 10)}</p>
      <p className="text-xs font-mono text-zinc-400 mt-0.5">{value.slice(11, 19)}</p>
    </>
  );
}

export default function TradeDetailModal({ trade, onClose }: Props) {
  if (!trade) return null;

  const isClose = trade.action === 'CLOSE_LONG' || trade.action === 'CLOSE_SHORT';
  const pnlColor = trade.realizedPnl != null && trade.realizedPnl >= 0 ? 'text-sky-400' : 'text-rose-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <div>
            <h2 className="text-base font-bold text-zinc-100">거래 상세</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{trade.symbolName ?? trade.symbol} · {trade.symbol}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-zinc-400 text-lg"></i>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* 기본 정보 */}
          <div className="bg-zinc-800/50 rounded-xl px-5 py-4 grid grid-cols-3 gap-4">
            <Field label="모드">
              <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${MODE_STYLE[trade.mode]}`}>
                {trade.mode === 'LIVE' ? '실전' : '모의'}
              </span>
            </Field>
            <Field label="액션">
              <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${ACTION_STYLE[trade.action]}`}>
                {ACTION_LABEL[trade.action] ?? trade.action}
              </span>
            </Field>
            <Field label="주문 상태">
              <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLE[trade.orderStatus]}`}>
                {trade.orderStatus === 'SUCCESS' ? '성공' : '실패'}
              </span>
            </Field>
          </div>

          {/* 수량 / 진입가(매수) 또는 청산가(청산) / 총금액 */}
          <div className="bg-zinc-800/50 rounded-xl px-5 py-4 grid grid-cols-3 gap-4">
            <Field label="수량">
              <p className="text-sm font-bold text-zinc-100">{trade.shares.toLocaleString()}주</p>
            </Field>
            {isClose ? (
              <>
                <Field label="청산가">
                  <p className="text-sm font-bold text-zinc-100">
                    {trade.exitPrice != null ? `₩${trade.exitPrice.toLocaleString()}` : '—'}
                  </p>
                </Field>
                <Field label="총매도금액">
                  <p className="text-sm font-bold text-sky-300">
                    {trade.exitPrice != null ? `₩${(trade.exitPrice * trade.shares).toLocaleString()}` : '—'}
                  </p>
                </Field>
              </>
            ) : (
              <>
                <Field label="진입가">
                  <p className="text-sm font-bold text-zinc-100">
                    {trade.entryPrice != null ? `₩${trade.entryPrice.toLocaleString()}` : '—'}
                  </p>
                </Field>
                <Field label="총매수금액">
                  <p className="text-sm font-bold text-teal-300">
                    {trade.entryPrice != null ? `₩${(trade.entryPrice * trade.shares).toLocaleString()}` : '—'}
                  </p>
                </Field>
              </>
            )}
          </div>

          {/* 손익 / 보유봉수 */}
          {isClose && (
            <div className="bg-zinc-800/50 rounded-xl px-5 py-4 grid grid-cols-3 gap-4">
              <Field label="실현 손익">
                <p className={`text-sm font-bold ${pnlColor}`}>
                  {trade.realizedPnl != null
                    ? `${trade.realizedPnl >= 0 ? '+' : ''}₩${trade.realizedPnl.toLocaleString()}`
                    : '—'}
                </p>
              </Field>
              <Field label="보유 봉 수">
                <p className="text-sm font-bold text-zinc-100">
                  {trade.barsHeld != null ? `${trade.barsHeld}봉` : '—'}
                </p>
              </Field>
              <Field label="청산 시각">
                <Dt value={trade.exitAt} />
              </Field>
            </div>
          )}

          {/* 진입 / 생성 시각 */}
          <div className="bg-zinc-800/50 rounded-xl px-5 py-4 grid grid-cols-2 gap-4">
            <Field label="진입 시각">
              <Dt value={trade.entryAt} />
            </Field>
            <Field label="생성 일시">
              <Dt value={trade.createdAt} />
            </Field>
          </div>

          {/* SL / TP */}
          <div className="bg-zinc-800/50 rounded-xl px-5 py-4 grid grid-cols-2 gap-4">
            <Field label="손절가 (Stop)">
              <p className="text-sm text-zinc-200">
                {trade.stopPrice != null ? `₩${trade.stopPrice.toLocaleString()}` : '—'}
              </p>
            </Field>
            <Field label="익절가 (TP)">
              <p className="text-sm text-zinc-200">
                {trade.tpPrice != null ? `₩${trade.tpPrice.toLocaleString()}` : '—'}
              </p>
            </Field>
          </div>

          {/* 자본 현황 */}
          <div className="bg-zinc-800/50 rounded-xl px-5 py-4 grid grid-cols-2 gap-4">
            <Field label="현재 자본">
              <p className="text-sm text-zinc-200">
                {trade.currentEquity != null ? trade.currentEquity.toLocaleString() : '—'}
              </p>
            </Field>
            <Field label="최대 자본 (Peak)">
              <p className="text-sm text-zinc-200">
                {trade.peakEquity != null ? trade.peakEquity.toLocaleString() : '—'}
              </p>
            </Field>
          </div>

          {/* 에러 메시지 (실패 시) */}
          {trade.orderStatus === 'FAILED' && trade.errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-5 py-4">
              <p className="text-xs text-rose-400 mb-1">오류 메시지</p>
              <p className="text-sm text-rose-300 break-words">{trade.errorMessage}</p>
            </div>
          )}

          {/* 적용 전략 / 유저 */}
          {(trade.menuGrade != null || trade.userName) && (
            <div className="bg-zinc-800/30 rounded-xl px-5 py-3 space-y-1.5">
              {trade.menuGrade != null && (
                <p className="text-xs text-zinc-600">적용 전략: <span className="text-zinc-500">{trade.menuGrade}등급</span></p>
              )}
              {trade.userName && (
                <p className="text-xs text-zinc-600">유저: <span className="text-zinc-400">{trade.userName}</span></p>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-zinc-800 flex justify-end sticky bottom-0 bg-zinc-900">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
