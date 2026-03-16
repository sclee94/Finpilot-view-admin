import type { Report } from '../../../types';

interface ReportCardProps {
  report: Report;
}

export default function ReportCard({ report }: ReportCardProps) {
  const { title, description, icon, date, status } = report;
  
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/30 transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 flex items-center justify-center bg-teal-500/15 rounded-xl">
          <i className={`${icon} text-2xl text-teal-400`}></i>
        </div>
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
          status === '완료' ? 'bg-emerald-500/15 text-emerald-400' : 
          status === '진행중' ? 'bg-teal-500/15 text-teal-400' :
          'bg-sky-500/15 text-sky-400'
        }`}>
          {status}
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-zinc-100 mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 mb-4">{description}</p>
      
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <span className="text-xs text-zinc-600">{date}</span>
        <button className="px-3 py-1 text-xs font-medium text-teal-400 hover:bg-teal-500/15 rounded-lg transition-colors whitespace-nowrap cursor-pointer">
          다운로드
        </button>
      </div>
    </div>
  );
}
