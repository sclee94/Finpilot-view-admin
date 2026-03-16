interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  trend: 'up' | 'down';
  icon: string;
  dateLabel?: string;
  subValues?: { label: string; value: string }[];
  isSelected?: boolean;
  onClick?: () => void;
}

export default function StatsCard({ title, value, change, trend, icon, dateLabel, subValues, isSelected, onClick }: StatsCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-zinc-900 rounded-xl p-6 border transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'border-teal-500 shadow-lg shadow-teal-500/20'
          : 'border-zinc-800 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/30'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${
          trend === 'up' ? 'bg-teal-500/15' : 'bg-red-500/15'
        }`}>
          <i className={`${icon} text-2xl ${
            trend === 'up' ? 'text-teal-400' : 'text-red-400'
          }`}></i>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          {change && (
            <span className={`text-sm font-medium ${
              trend === 'up' ? 'text-teal-400' : 'text-red-400'
            }`}>
              {change}
            </span>
          )}
          {dateLabel && (
            <span className="text-xs text-zinc-500">{dateLabel}</span>
          )}
        </div>
      </div>
      <h3 className="text-sm text-zinc-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-zinc-100">{value}</p>
      {subValues && subValues.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {subValues.map((sub) => (
            <span key={sub.label} className="text-xs text-zinc-400">
              <span className="text-zinc-500">{sub.label}</span> {sub.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
