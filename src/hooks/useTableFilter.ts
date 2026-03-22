import { useState, useMemo, useEffect, useRef } from 'react';

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

  // searchFields 배열을 ref로 안정화 — 매 렌더마다 새 배열이 넘어와도 useMemo가 재실행되지 않도록
  const searchFieldsRef = useRef(searchFields);
  searchFieldsRef.current = searchFields;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterFn]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = searchFieldsRef.current.some((field) => {
        const value = item[field];
        return typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase());
      });
      const matchesFilter = filterFn ? filterFn(item) : true;
      return matchesSearch && matchesFilter;
    });
  }, [data, searchTerm, filterFn]);

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
