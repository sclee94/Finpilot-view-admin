import { useEffect, useState } from 'react';
import StatsCard from './components/StatsCard';
import StockChart from './components/StockChart';
import RecentActivity from './components/RecentActivity';
import RecentTrades from './components/RecentTrades';
import PageLayout from '../../components/PageLayout';
import { getDashboardSummary } from '../../api/dashboardApi';
import type { DashboardSummary } from '../../types';
import { formatKrwCompact, formatUsd, percentChange } from './format';

type Metric = 'users' | 'trades' | 'volume';

const thisMonth = `${new Date().getMonth() + 1}월`;

export default function Dashboard() {
  const [selectedMetric, setSelectedMetric] = useState<Metric>('volume');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDashboardSummary()
      .then((res) => {
        if (cancelled) return;
        if (res.status === 200 && res.data) setSummary(res.data);
        else setError(res.message || '대시보드 조회 실패');
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  const s = summary;
  const month = s?.tradesThisMonth;
  const prev = s?.tradesPrevMonth;
  const tradeChange = month && prev ? percentChange(month.successCount, prev.successCount) : null;
  const amountChange = month && prev ? percentChange(month.krwAmount, prev.krwAmount) : null;

  // 자동매매 OFF → 중지, 오늘 주문 실패가 있으면 → 주의, 그 외 → 정상
  const failedToday = s?.tradesToday.failedCount ?? 0;
  const systemLabel = !s ? '—' : !s.tradingEnabled ? '중지' : failedToday > 0 ? '주의' : '정상';
  const systemOk = !!s && s.tradingEnabled && failedToday === 0;

  const cards = [
    {
      metric: 'users' as const,
      title: '총 사용자',
      value: s ? `${s.totalUsers.toLocaleString()}명` : '—',
      icon: 'ri-user-line',
      change: s ? `+${s.newUsersThisMonth.toLocaleString()}명` : undefined,
      trendUp: true,
      dateLabel: `${thisMonth} 신규`,
      subValues: s ? [
        { label: '활성', value: `${s.activeUsers.toLocaleString()}명` },
        { label: '관리자', value: `${s.adminUsers.toLocaleString()}명` },
      ] : undefined,
    },
    {
      metric: 'trades' as const,
      title: '이번달 체결',
      value: month ? `${month.successCount.toLocaleString()}건` : '—',
      icon: 'ri-stock-line',
      change: tradeChange?.label,
      trendUp: tradeChange?.up ?? true,
      dateLabel: '전월 동기 대비',
      subValues: s && month ? [
        { label: '실전', value: `${month.liveCount.toLocaleString()}건` },
        { label: '모의', value: `${month.paperCount.toLocaleString()}건` },
        { label: '오늘', value: `${s.tradesToday.successCount.toLocaleString()}건` },
      ] : undefined,
    },
    {
      metric: 'volume' as const,
      title: '이번달 거래대금',
      value: month ? formatKrwCompact(month.krwAmount) : '—',
      icon: 'ri-line-chart-line',
      change: amountChange?.label,
      trendUp: amountChange?.up ?? true,
      dateLabel: '전월 동기 대비',
      subValues: month ? [
        { label: '실전', value: formatKrwCompact(month.liveKrwAmount) },
        { label: '모의', value: formatKrwCompact(month.paperKrwAmount) },
        ...(month.usdAmount > 0 ? [{ label: '달러', value: formatUsd(month.usdAmount) }] : []),
        { label: '실현손익', value: `${month.realizedPnl >= 0 ? '+' : ''}${formatKrwCompact(month.realizedPnl)}` },
      ] : undefined,
    },
    {
      metric: undefined,
      title: '시스템 상태',
      value: systemLabel,
      icon: systemOk ? 'ri-shield-check-line' : 'ri-error-warning-line',
      change: s ? (s.tradingEnabled ? '자동매매 ON' : '자동매매 OFF') : undefined,
      trendUp: systemOk,
      dateLabel: s?.lastTradeAt ? `마지막 체결 ${s.lastTradeAt.slice(5, 16)}` : undefined,
      subValues: s ? [
        { label: '활성 세션', value: `${s.activeSessions.toLocaleString()}개` },
        { label: '보유 중', value: `${s.holdingSessions.toLocaleString()}개` },
        { label: '오늘 실패', value: `${failedToday.toLocaleString()}건` },
      ] : undefined,
    },
  ];

  return (
    <PageLayout>
      <div className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
            대시보드 데이터를 불러오지 못했습니다: {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map(({ metric, ...card }) => (
            <StatsCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              change={card.change}
              trend={card.trendUp ? 'up' : 'down'}
              dateLabel={card.dateLabel}
              subValues={card.subValues}
              isSelected={metric !== undefined && selectedMetric === metric}
              onClick={metric !== undefined ? () => setSelectedMetric(metric) : undefined}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StockChart selectedMetric={selectedMetric} />
          </div>
          <div>
            <RecentActivity activities={s?.recentActivities ?? null} />
          </div>
        </div>

        <RecentTrades trades={s?.recentTrades ?? null} />
      </div>
    </PageLayout>
  );
}
