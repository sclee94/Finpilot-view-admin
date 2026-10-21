/** ₩1.38억 / ₩5,230만 / ₩12,300 — 카드처럼 좁은 자리에 쓰는 원화 축약 표기 */
export function formatKrwCompact(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1e8) return `${sign}₩${(abs / 1e8).toLocaleString(undefined, { maximumFractionDigits: 2 })}억`;
  if (abs >= 1e4) return `${sign}₩${Math.round(abs / 1e4).toLocaleString()}만`;
  return `${sign}₩${Math.round(abs).toLocaleString()}`;
}

export function formatUsd(value: number): string {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

/** 전월 동기 대비 증감률 — 비교 기준이 0이면 %가 무의미하므로 '신규'/'0%'로 표기 */
export function percentChange(current: number, previous: number): { label: string; up: boolean } {
  if (previous === 0) return { label: current > 0 ? '신규' : '0%', up: true };
  const pct = ((current - previous) / previous) * 100;
  return { label: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, up: pct >= 0 };
}

/** 'yyyy-MM-dd HH:mm:ss'(KST) → '5분 전' 등. 7일 넘으면 날짜 그대로 */
export function formatRelativeTime(dateTime: string): string {
  const time = new Date(dateTime.replace(' ', 'T')).getTime();
  if (Number.isNaN(time)) return dateTime;
  const diffMin = Math.floor((Date.now() - time) / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 60 * 24) return `${Math.floor(diffMin / 60)}시간 전`;
  if (diffMin < 60 * 24 * 7) return `${Math.floor(diffMin / 60 / 24)}일 전`;
  return dateTime.slice(5, 10);
}
