import { useState, useMemo, useEffect } from 'react';

interface UseTableFilterOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  filterFn?: (item: T) => boolean;
  itemsPerPage?: number;
}

export function useTableFilter<T>({
  data,
  searchFields,
  filterFn,
  itemsPerPage = 10,
}: UseTableFilterOptions<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 검색어 또는 필터 변경 시 페이지를 1로 리셋
  // filterFn은 호출 측에서 useCallback으로 안정화해야 불필요한 리셋을 방지할 수 있음
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterFn]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = searchFields.some((field) => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });

      const matchesFilter = filterFn ? filterFn(item) : true;

      return matchesSearch && matchesFilter;
    });
  }, [data, searchTerm, searchFields, filterFn]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  return {
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    filteredData,
    paginatedData,
    totalPages,
  };
}
