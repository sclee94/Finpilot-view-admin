import { useState, useMemo } from 'react';

interface ChartDataPoint {
  x: number;
  y: number;
  label: string;
}

interface StockChartProps {
  selectedMetric?: 'users' | 'trades' | 'volume';
}

const periods = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

const CHART_CONFIG = {
  users: {
    title: '총 사용자 추이',
    color: '#14B8A6',
    gradientId: 'chartGradientUsers',
    data: [
      { x: 0, y: 210, label: '1일' },
      { x: 100, y: 190, label: '7일' },
      { x: 200, y: 160, label: '14일' },
      { x: 300, y: 140, label: '21일' },
      { x: 400, y: 110, label: '30일' },
      { x: 500, y: 95, label: '' },
      { x: 600, y: 75, label: '' },
      { x: 700, y: 55, label: '' },
      { x: 800, y: 40, label: '' },
    ] as ChartDataPoint[],
    stats: [
      { label: '평균 사용자', value: '1,050명' },
      { label: '최고 사용자', value: '1,234명' },
      { label: '최저 사용자', value: '820명' },
    ],
  },
  trades: {
    title: '활성 거래 추이',
    color: '#F59E0B',
    gradientId: 'chartGradientTrades',
    data: [
      { x: 0, y: 220, label: '1일' },
      { x: 100, y: 195, label: '7일' },
      { x: 200, y: 175, label: '14일' },
      { x: 300, y: 155, label: '21일' },
      { x: 400, y: 130, label: '30일' },
      { x: 500, y: 115, label: '' },
      { x: 600, y: 95, label: '' },
      { x: 700, y: 80, label: '' },
      { x: 800, y: 60, label: '' },
    ] as ChartDataPoint[],
    stats: [
      { label: '평균 거래', value: '720건' },
      { label: '최고 거래', value: '856건' },
      { label: '최저 거래', value: '540건' },
    ],
  },
  volume: {
    title: '총 거래량 추이',
    color: '#14B8A6',
    gradientId: 'chartGradientVolume',
    data: [
      { x: 0, y: 200, label: '1일' },
      { x: 100, y: 180, label: '7일' },
      { x: 200, y: 150, label: '14일' },
      { x: 300, y: 170, label: '21일' },
      { x: 400, y: 120, label: '30일' },
      { x: 500, y: 140, label: '' },
      { x: 600, y: 90, label: '' },
      { x: 700, y: 110, label: '' },
      { x: 800, y: 70, label: '' },
    ] as ChartDataPoint[],
    stats: [
      { label: '평균 거래량', value: '₩1.8B' },
      { label: '최고 거래량', value: '₩2.4B' },
      { label: '최저 거래량', value: '₩1.2B' },
    ],
  },
};

export default function StockChart({ selectedMetric = 'volume' }: StockChartProps) {
  const [period, setPeriod] = useState('1M');

  const config = CHART_CONFIG[selectedMetric];
  const { title, color, gradientId, data, stats } = config;

  const { pathD, areaD } = useMemo(() => {
    const path = `M ${data.map((d) => `${d.x} ${d.y}`).join(' L ')}`;
    return { pathD: path, areaD: `${path} L 800 250 L 0 250 Z` };
  }, [data]);

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <h2 className="text-lg font-bold text-zinc-100 transition-all">{title}</h2>
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
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

      <div className="relative h-64">
        <svg className="w-full h-full" viewBox="0 0 800 250" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#${gradientId})`} />
          <path d={pathD} fill="none" stroke={color} strokeWidth="3" />
          {data.map((point, index) => (
            <circle key={index} cx={point.x} cy={point.y} r="4" fill={color} />
          ))}
        </svg>

        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-zinc-500 px-2">
          {data.filter((d) => d.label).map((point, index) => (
            <span key={index}>{point.label}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-800">
        {stats.map((stat, index) => (
          <div key={index}>
            <p className="text-xs text-zinc-500 mb-1">{stat.label}</p>
            <p className="text-lg font-bold text-zinc-100">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}