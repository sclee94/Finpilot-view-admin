import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import Pagination from '../../components/Pagination';
import FilterButtonGroup from '../../components/FilterButtonGroup';
import BriefingCategoryBadge from './BriefingCategoryBadge';
import { markdownToPlainPreview } from '../../utils/markdownPreview';
import { BRIEFING_CATEGORIES, getBriefingList } from '../../api/briefingApi';
import type { Briefing, BriefingCategory } from '../../api/briefingApi';

const PAGE_SIZE = 10;

// ─── Page ─────────────────────────────────────────────────────────────────────

// 읽기 전용 브리핑 게시판 — 글은 외부 뉴스브리핑 자동화가 API로 등록한다(등록/수정/삭제 UI 없음).
// 카테고리·페이지는 URL 쿼리(?category=&page=)에 담아 상세에서 뒤로가기 시 보던 목록으로 돌아오게 한다.
export default function BriefingBoard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = (searchParams.get('category') ?? 'ALL') as BriefingCategory | 'ALL';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [items,      setItems]      = useState<Briefing[]>([]);
  const [totalPage,  setTotalPage]  = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getBriefingList({
        ...(category !== 'ALL' ? { category } : {}),
        page,
        size: PAGE_SIZE,
      });
      if (res.status >= 400) {
        setError(res.message || '브리핑 목록을 불러오지 못했습니다.');
        return;
      }
      setItems(res.data?.content ?? []);
      setTotalPage(res.data?.totalPage || 1);
      setTotalCount(res.data?.totalCount ?? 0);
    } catch {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [category, page]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const changeCategory = (id: string) => {
    setSearchParams(id === 'ALL' ? {} : { category: id });
  };

  const changePage = (p: number) => {
    setSearchParams({ ...(category !== 'ALL' ? { category } : {}), page: String(p) });
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white mb-0.5">브리핑</h1>
          <p className="text-xs text-zinc-400">아침·저녁·장마감후 시장 브리핑을 확인할 수 있습니다.</p>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-flex">
            <FilterButtonGroup
              options={[{ id: 'ALL', label: '전체' }, ...BRIEFING_CATEGORIES.map(c => ({ id: c.value, label: c.label }))]}
              value={category}
              onChange={changeCategory}
            />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-200">게시글</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500">총 {totalCount}건</span>
              <button
                onClick={fetchList}
                className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                title="새로고침"
              >
                <i className={`ri-refresh-line ${loading ? 'animate-spin' : ''}`}></i>
              </button>
            </div>
          </div>

          {error ? (
            <div className="flex items-center gap-2 m-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300">
              <i className="ri-error-warning-line shrink-0"></i>
              {error}
            </div>
          ) : loading && items.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <i className="ri-loader-4-line animate-spin text-3xl block mb-2"></i>
              불러오는 중...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <i className="ri-newspaper-line text-4xl block mb-2"></i>
              등록된 브리핑이 없습니다.
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800">
              {items.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => navigate(`/briefing/${item.id}`)}
                    className="w-full text-left px-6 py-4 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1.5 min-w-0">
                      <BriefingCategoryBadge category={item.category} />
                      <span className="text-sm sm:text-base font-medium text-zinc-100 truncate">{item.title}</span>
                    </div>
                    {item.preview && (
                      <p className="text-sm text-zinc-400 line-clamp-2 break-words">{markdownToPlainPreview(item.preview)}</p>
                    )}
                    <p className="text-xs text-zinc-500 mt-1.5">{item.briefingDate}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {totalPage > 1 && (
            <div className="px-6 py-4 border-t border-zinc-800">
              <Pagination currentPage={page} totalPages={totalPage} onPageChange={changePage} />
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
