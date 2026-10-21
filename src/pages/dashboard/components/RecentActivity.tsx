import { Link } from 'react-router-dom';
import type { DashboardActivity } from '../../../types';
import { formatRelativeTime } from '../format';

interface Props {
  activities: DashboardActivity[] | null; // null = 로딩 중
}

const ACTION_LABEL: Record<string, string> = {
  BUY:         '매수',
  ADD_LONG:    '추가매수',
  SELL:        '매도',
  SELL_SHORT:  '공매도',
  CLOSE_LONG:  '청산(롱)',
  CLOSE_SHORT: '청산(숏)',
};

const TYPE_STYLE: Record<DashboardActivity['type'], { color: string; icon: string }> = {
  TRADE:        { color: 'bg-emerald-500/15 text-emerald-400', icon: 'ri-check-line' },
  TRADE_FAILED: { color: 'bg-red-500/15 text-red-400',         icon: 'ri-alert-line' },
  SIGNUP:       { color: 'bg-sky-500/15 text-sky-400',         icon: 'ri-user-add-line' },
};

function describe(a: DashboardActivity): string {
  if (a.type === 'SIGNUP') return '회원가입';
  const mode = a.mode === 'LIVE' ? '[실전]' : a.mode === 'PAPER' ? '[모의]' : '';
  const action = (a.action && ACTION_LABEL[a.action]) ?? a.action ?? '';
  const shares = a.shares != null ? ` ${a.shares.toLocaleString()}주` : '';
  const text = `${mode} ${a.symbolName ?? a.symbol ?? ''} ${action}${shares}`.trim();
  return a.type === 'TRADE_FAILED' ? `${text} 주문 실패` : text;
}

export default function RecentActivity({ activities }: Props) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <h2 className="text-lg font-bold text-zinc-100 mb-4">최근 활동</h2>
      <div className="space-y-4">
        {activities === null ? (
          <p className="py-8 text-center text-sm text-zinc-500">불러오는 중...</p>
        ) : activities.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">최근 활동이 없습니다</p>
        ) : (
          activities.map((activity, i) => {
            const style = TYPE_STYLE[activity.type] ?? { color: 'bg-zinc-700 text-zinc-400', icon: 'ri-record-circle-line' };
            return (
              <div
                key={`${activity.type}-${activity.occurredAt}-${i}`}
                className="flex items-start gap-3 pb-4 border-b border-zinc-800 last:border-0 last:pb-0"
              >
                <div className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 ${style.color}`}>
                  <i className={`${style.icon} text-sm`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{activity.userName ?? '알 수 없음'}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate" title={activity.errorMessage ?? undefined}>
                    {describe(activity)}
                  </p>
                </div>
                <span className="text-xs text-zinc-500 whitespace-nowrap" title={activity.occurredAt}>
                  {formatRelativeTime(activity.occurredAt)}
                </span>
              </div>
            );
          })
        )}
      </div>
      <Link to="/reports" className="block w-full mt-4 py-2 text-sm font-medium text-center text-teal-400 hover:text-teal-300 transition-colors whitespace-nowrap">
        전체 매매현황 보기
      </Link>
    </div>
  );
}
