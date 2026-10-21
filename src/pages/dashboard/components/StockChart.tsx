import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { getDashboardSeries } from '../../../api/dashboardApi';
import type { DashboardPeriod, DashboardSeries, DashboardSeriesPoint } from '../../../types';
import { formatKrwCompact } from '../format';

type Metric = 'users' | 'trades' | 'volume';

interface StockChartProps {
  selectedMetric?: Metric;
}

const PERIODS: DashboardPeriod[] = ['1W', '1M', '3M', '1Y', 'ALL'];

const WIDTH = 800;
const HEIGHT = 250;
const TOP_PAD = 16;
const BOTTOM_PAD = 28; // x축 라벨 자리
const X_LABEL_COUNT = 5;
const MAX_DOTS = 31;   // 이보다 점이 많으면 원은 생략하고 선만 그린다

const CHART_CONFIG: Record<Metric, {
  title: string;
  color: string;
  gradientId: string;
  value: (p: DashboardSeriesPoint) => number;
  format: (v: number) => string;
}> = {
  users: {
    title: '누적 사용자 추이',
    color: '#14B8A6',
    gradientId: 'chartGradientUsers',
    value: (p) => p.totalUsers,
    format: (v) => `${v.toLocaleString()}명`,
  },
  trades: {
    title: '체결 건수 추이',
    color: '#F59E0B',
    gradientId: 'chartGradientTrades',
    value: (p) => p.tradeCount,
    format: (v) => `${Math.round(v).toLocaleString()}건`,
  },
  volume: {
    title: '거래대금 추이',
    color: '#14B8A6',
    gradientId: 'chartGradientVolume',
    value: (p) => p.krwAmount,
    format: formatKrwCompact,
  },
};

function bucketLabel(bucket: string, unit: DashboardSeries['unit']) {
  return unit === 'MONTH' ? bucket.slice(2).replace('-', '.') : bucket.slice(5).replace('-', '/');
}

export default function StockChart({ selectedMetric = 'volume' }: StockChartProps) {
  const [period, setPeriod] = useState<DashboardPeriod>('1M');
  const [series, setSeries] = useState<DashboardSeries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getDashboardSeries(period)
      .then((res) => {
        if (cancelled) return;
        if (res.status === 200 && res.data) setSeries(res.data);
        else setError(res.message || '차트 조회 실패');
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [period]);

  const config = CHART_CONFIG[selectedMetric];
  const { title, color, gradientId } = config;
  const points = useMemo(() => series?.points ?? [], [series]);
  const unit = series?.unit ?? 'DAY';
  const unitLabel = unit === 'MONTH' ? '월' : '일';

  const values = useMemo(() => points.map(config.value), [points, config]);

  const { coords, pathD, areaD } = useMemo(() => {
    if (values.length === 0) return { coords: [], pathD: '', areaD: '' };
    // 0 기준선 — 건수/금액은 0부터 보여야 증감이 왜곡되지 않는다
    const max = Math.max(...values, 1);
    const baseY = HEIGHT - BOTTOM_PAD;
    const xs = values.length === 1 ? [WIDTH / 2] : values.map((_, i) => (i / (values.length - 1)) * WIDTH);
    const c = values.map((v, i) => ({ x: xs[i], y: baseY - (v / max) * (baseY - TOP_PAD) }));
    const path = `M ${c.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
    return { coords: c, pathD: path, areaD: `${path} L ${c[c.length - 1].x} ${baseY} L ${c[0].x} ${baseY} Z` };
  }, [values]);

  const xLabels = useMemo(() => {
    if (points.length === 0) return [];
    const count = Math.min(X_LABEL_COUNT, points.length);
    const idx = count === 1 ? [0] : Array.from({ length: count }, (_, i) => Math.round((i * (points.length - 1)) / (count - 1)));
    return idx.map((i) => ({ i, label: bucketLabel(points[i].bucket, unit) }));
  }, [points, unit]);

  const stats = useMemo(() => {
    if (values.length === 0) return [];
    if (selectedMetric === 'users') {
      const newUsers = points.reduce((sum, p) => sum + p.newUsers, 0);
      return [
        { label: '기간 신규 가입', value: `${newUsers.toLocaleString()}명` },
        { label: '기간 시작', value: config.format(values[0] - points[0].newUsers) },
        { label: '현재 사용자', value: config.format(values[values.length - 1]) },
      ];
    }
    const total = values.reduce((a, b) => a + b, 0);
    return [
      { label: '기간 합계', value: config.format(total) },
      { label: `${unitLabel} 평균`, value: config.format(total / values.length) },
      { label: `${unitLabel} 최고`, value: config.format(Math.max(...values)) },
    ];
  }, [values, points, selectedMetric, config, unitLabel]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setHoverIndex(Math.max(0, Math.min(points.length - 1, Math.round(ratio * (points.length - 1)))));
  };

  const hover = hoverIndex !== null && coords[hoverIndex] ? {
    left: (coords[hoverIndex].x / WIDTH) * 100,
    top: (coords[hoverIndex].y / HEIGHT) * 100,
    label: points[hoverIndex].bucket,
    value: config.format(values[hoverIndex]),
  } : null;

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <h2 className="text-lg font-bold text-zinc-100 transition-all">{title}</h2>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                period === p
                  ? 'bg-teal-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div
        className="relative h-64"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {coords.length > 0 && (
          <svg className="w-full h-full" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#${gradientId})`} />
            <path d={pathD} fill="none" stroke={color} strokeWidth="3" vectorEffect="non-scaling-stroke" />
            {coords.length <= MAX_DOTS && coords.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4" fill={color} />
            ))}
            {hover && (
              <line
                x1={coords[hoverIndex!].x} x2={coords[hoverIndex!].x} y1={TOP_PAD} y2={HEIGHT - BOTTOM_PAD}
                stroke="#52525b" strokeDasharray="4 4" vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
        )}

        {hover && (
          <div
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-full -mt-2 px-2.5 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-xs whitespace-nowrap shadow-lg"
            style={{ left: `${Math.min(92, Math.max(8, hover.left))}%`, top: `${hover.top}%` }}
          >
            <p className="text-zinc-400">{hover.label}</p>
            <p className="font-bold text-zinc-100">{hover.value}</p>
          </div>
        )}

        {(loading || error || coords.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
            {loading ? '불러오는 중...' : error ? `차트를 불러오지 못했습니다: ${error}` : '데이터가 없습니다'}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-5 text-xs text-zinc-500">
          {xLabels.map(({ i, label }, n) => (
            <span
              key={i}
              className="absolute"
              style={{
                left: `${(coords[i]?.x ?? 0) / WIDTH * 100}%`,
                transform: n === 0 ? 'none' : n === xLabels.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-800">
        {(stats.length > 0 ? stats : [{ label: '—', value: '—' }, { label: '—', value: '—' }, { label: '—', value: '—' }]).map((stat, index) => (
          <div key={index}>
            <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
            <p className="text-lg font-bold text-zinc-100">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
