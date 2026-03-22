import { useState } from 'react';
import StatsCard from './components/StatsCard';
import StockChart from './components/StockChart';
import RecentActivity from './components/RecentActivity';
import RecentTrades from './components/RecentTrades';
import PageLayout from '../../components/PageLayout';
import { STATS_DATA } from '../../constants';

type Metric = 'users' | 'trades' | 'volume';

const METRIC_MAP: Record<number, Metric> = { 0: 'users', 1: 'trades', 2: 'volume' };

export default function Dashboard() {
  const [selectedMetric, setSelectedMetric] = useState<Metric>('volume');

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS_DATA.map((stat, index) => {
            const metric = METRIC_MAP[index];
            return (
              <StatsCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                change={stat.trend}
                trend={stat.trendUp ? 'up' : 'down'}
                dateLabel={stat.dateLabel}
                subValues={stat.subValues}
                isSelected={metric !== undefined && selectedMetric === metric}
                onClick={metric !== undefined ? () => setSelectedMetric(metric) : undefined}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <StockChart selectedMetric={selectedMetric} />
          </div>
          <div>
            <RecentActivity />
          </div>
        </div>

        <RecentTrades />
      </div>
    </PageLayout>
  );
}