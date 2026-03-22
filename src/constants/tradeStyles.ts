/** 시장 배지 스타일 (배경 + 텍스트) — reports, TradeDetailModal */
export const MARKET_STYLE: Record<string, string> = {
  '코스피': 'bg-sky-500/15 text-sky-400',
  '코스닥': 'bg-violet-500/15 text-violet-400',
  '나스닥': 'bg-orange-500/15 text-orange-400',
};

/** 시장 텍스트 스타일 (텍스트만) — RecentTrades */
export const MARKET_TEXT_STYLE: Record<string, string> = {
  '코스피': 'text-sky-400',
  '코스닥': 'text-violet-400',
  '나스닥': 'text-orange-400',
};

/** 거래 상태 배지 스타일 */
export const TRADE_STATUS_STYLE: Record<string, string> = {
  '체결': 'bg-emerald-500/15 text-emerald-400',
  '대기': 'bg-amber-500/15 text-amber-400',
  '취소': 'bg-zinc-700 text-zinc-400',
};

/** 거래 유형 배지 스타일 */
export const TRADE_TYPE_STYLE: Record<string, string> = {
  '매수': 'bg-teal-500/15 text-teal-400',
  '매도': 'bg-rose-500/15 text-rose-400',
};
