import { Link } from 'react-router-dom';
import { RECENT_ACTIVITIES } from '../../../constants';

interface Activity {
  id: number;
  user: string;
  action: string;
  time: string;
  type: 'success' | 'warning' | 'info';
}

export default function RecentActivity() {
  const getTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/15 text-emerald-400';
      case 'warning':
        return 'bg-teal-500/15 text-teal-400';
      case 'info':
        return 'bg-sky-500/15 text-sky-400';
      default:
        return 'bg-zinc-700 text-zinc-400';
    }
  };

  const getTypeIcon = (type: Activity['type']) => {
    switch (type) {
      case 'success':
        return 'ri-check-line';
      case 'warning':
        return 'ri-alert-line';
      case 'info':
        return 'ri-information-line';
      default:
        return 'ri-record-circle-line';
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
      <h2 className="text-lg font-bold text-zinc-100 mb-4">최근 활동</h2>
      <div className="space-y-4">
        {RECENT_ACTIVITIES.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 pb-4 border-b border-zinc-800 last:border-0 last:pb-0"
          >
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0 ${getTypeColor(activity.type)}`}
            >
              <i className={`${getTypeIcon(activity.type)} text-sm`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200">{activity.user}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{activity.action}</p>
            </div>
            <span className="text-xs text-zinc-500 whitespace-nowrap">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
      <Link to="/logs" className="block w-full mt-4 py-2 text-sm font-medium text-center text-teal-400 hover:text-teal-300 transition-colors whitespace-nowrap">
        모든 활동 보기
      </Link>
    </div>
  );
}