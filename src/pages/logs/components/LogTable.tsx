import { useState, useCallback } from 'react';
import type { Log } from '../../../types';
import { LOG_LEVELS } from '../../../constants';
import SearchInput from '../../../components/SearchInput';
import Badge from '../../../components/Badge';
import Pagination from '../../../components/Pagination';
import { useTableFilter } from '../../../hooks/useTableFilter';

interface LogTableProps {
  logs: Log[];
}

export default function LogTable({ logs }: LogTableProps) {
  const [levelFilter, setLevelFilter] = useState('all');

  const filterFn = useCallback((log: Log) => {
    return levelFilter === 'all' || log.level === levelFilter;
  }, [levelFilter]);

  const {
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    paginatedData: paginatedLogs,
    totalPages,
  } = useTableFilter({
    data: logs,
    searchFields: ['message', 'user'],
    filterFn,
    itemsPerPage: 15,
  });

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case LOG_LEVELS.INFO:
        return 'info';
      case LOG_LEVELS.WARNING:
        return 'warning';
      case LOG_LEVELS.ERROR:
        return 'danger';
      case LOG_LEVELS.SUCCESS:
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="메시지 또는 사용자 검색..."
          className="flex-1 min-w-[200px]"
        />
        
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <option value="all">모든 레벨</option>
          <option value={LOG_LEVELS.INFO}>정보</option>
          <option value={LOG_LEVELS.WARNING}>경고</option>
          <option value={LOG_LEVELS.ERROR}>오류</option>
          <option value={LOG_LEVELS.SUCCESS}>성공</option>
        </select>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-800/60 border-b border-zinc-800">
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">시간</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">레벨</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">사용자</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">메시지</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-zinc-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-6 py-4">
                    <Badge variant={getLevelBadgeVariant(log.level)}>
                      {log.level}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-300">{log.user}</td>
                  <td className="px-6 py-4 text-sm text-zinc-300">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}