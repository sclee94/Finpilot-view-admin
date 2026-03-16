import type { Stock } from '../../../types';
import SearchInput from '../../../components/SearchInput';
import Badge from '../../../components/Badge';
import Pagination from '../../../components/Pagination';
import { useTableFilter } from '../../../hooks/useTableFilter';

interface StockListProps {
  stocks: Stock[];
}

export default function StockList({ stocks }: StockListProps) {
  const {
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    paginatedData: paginatedStocks,
    totalPages,
  } = useTableFilter({
    data: stocks,
    searchFields: ['name', 'symbol'],
    itemsPerPage: 10,
  });

  const getChangeBadgeVariant = (change: number) => {
    if (change > 0) return 'success';
    if (change < 0) return 'danger';
    return 'default';
  };

  return (
    <div className="space-y-4">
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="종목명 또는 심볼 검색..."
        className="max-w-md"
      />

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-800/60 border-b border-zinc-800">
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">심볼</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">종목명</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">현재가</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">변동</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">변동률</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">거래량</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {paginatedStocks.map((stock) => (
                <tr key={stock.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-zinc-200">{stock.symbol}</td>
                  <td className="px-6 py-4 text-sm text-zinc-300">{stock.name}</td>
                  <td className="px-6 py-4 text-sm text-right text-zinc-200 font-medium">
                    ${stock.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Badge variant={getChangeBadgeVariant(stock.change)}>
                      {stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Badge variant={getChangeBadgeVariant(stock.changePercent)}>
                      {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-zinc-500">
                    {stock.volume.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        className="w-8 h-8 flex items-center justify-center text-teal-400 hover:bg-teal-500/15 rounded-lg transition-colors"
                        title="상세보기"
                      >
                        <i className="ri-eye-line"></i>
                      </button>
                      <button
                        className="w-8 h-8 flex items-center justify-center text-sky-400 hover:bg-sky-500/15 rounded-lg transition-colors"
                        title="차트"
                      >
                        <i className="ri-line-chart-line"></i>
                      </button>
                    </div>
                  </td>
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