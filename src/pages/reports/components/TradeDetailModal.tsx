import { Trade } from '../../../mocks/trades';
import { MARKET_STYLE, TRADE_STATUS_STYLE, TRADE_TYPE_STYLE } from '../../../constants/tradeStyles';

interface TradeDetailModalProps {
  trade: Trade | null;
  onClose: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

export default function TradeDetailModal({ trade, onClose }: TradeDetailModalProps) {
  if (!trade) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-base font-bold text-zinc-100">거래 상세</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-zinc-400 text-lg"></i>
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-5 space-y-5">

          {/* 작성자 + 종목명 / 시장 + 거래유형 + 상태 */}
          <div className="bg-zinc-800/50 rounded-xl px-5 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-x-6">
              <Field label="작성자">
                <p className="text-sm text-zinc-200">{trade.author}</p>
              </Field>
              <Field label="종목명">
                <p className="text-sm text-zinc-200 font-medium">{trade.stockName}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{trade.stockCode}</p>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-x-6">
              <Field label="시장">
                <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${MARKET_STYLE[trade.market] ?? 'bg-zinc-700 text-zinc-400'}`}>
                  {trade.market}
                </span>
              </Field>
              <Field label="거래 유형">
                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${TRADE_TYPE_STYLE[trade.tradeType] ?? 'bg-zinc-700 text-zinc-400'}`}>
                  {trade.tradeType}
                </span>
              </Field>
              <Field label="상태">
                <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${TRADE_STATUS_STYLE[trade.status] ?? 'bg-zinc-700 text-zinc-400'}`}>
                  {trade.status}
                </span>
              </Field>
            </div>
          </div>

          {/* 단가 / 수량 / 총 거래금액 */}
          <div className="grid grid-cols-3 gap-x-6 bg-zinc-800/50 rounded-xl px-5 py-4">
            <Field label="단가">
              <p className="text-sm font-bold text-zinc-100">₩{trade.price.toLocaleString()}</p>
            </Field>
            <Field label="수량">
              <p className="text-sm font-bold text-zinc-100">{trade.quantity.toLocaleString()}주</p>
            </Field>
            <Field label="총 거래금액">
              <p className="text-sm font-bold text-amber-400">₩{trade.totalAmount.toLocaleString()}</p>
            </Field>
          </div>

          {/* 신청날짜 / 확정날짜 */}
          <div className="grid grid-cols-2 gap-x-6 bg-zinc-800/50 rounded-xl px-5 py-4">
            <Field label="신청날짜">
              <p className="text-xs font-mono text-zinc-200">{trade.applyDate.slice(0, 10)}</p>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">{trade.applyDate.slice(11)}</p>
            </Field>
            <Field label="확정날짜">
              {trade.confirmDate ? (
                <>
                  <p className="text-xs font-mono text-zinc-200">{trade.confirmDate.slice(0, 10)}</p>
                  <p className="text-xs font-mono text-zinc-400 mt-0.5">{trade.confirmDate.slice(11)}</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-mono text-zinc-500">—</p>
                  <p className="text-xs font-mono text-zinc-500 mt-0.5">—</p>
                </>
              )}
            </Field>
          </div>

        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
