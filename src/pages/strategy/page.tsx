import { useState, useCallback, useEffect } from 'react';
import PageLayout from '../../components/PageLayout';
import { apiClient } from '../../api/apiClient';
import { authStorage } from '../../utils/auth';
import { PERMISSIONS } from '../../constants';
import type { ApiResponse, PageResponse } from '../../types/index';
import {
  type CustomFormParams,
  type BoardItem,
  type StrategyConfigDTO,
  EMPTY_CUSTOM,
  dtoToBoardItem, strategyToDto, toStrategyParams,
} from './strategyTypes';
import CustomParamForm from './components/CustomParamForm';
import BoardPanel from './components/BoardPanel';
import Pagination from '../../components/Pagination';

export default function Strategy() {
  const loginUser = authStorage.get();
  const isAdmin = (loginUser?.permission ?? 0) >= PERMISSIONS.ADMIN;

  const [menuGrade, setMenuGrade] = useState<number | null>(null);

  // 커스텀 탭
  const [params, setParams] = useState<CustomFormParams>({ ...EMPTY_CUSTOM });
  const [title, setTitle] = useState('');
  const [saved, setSaved] = useState(false);

  // 게시판
  const BOARD_SIZE = 15;
  const [board, setBoard] = useState<BoardItem[]>([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardPage, setBoardPage] = useState(1);
  const [boardTotalPage, setBoardTotalPage] = useState(1);
  const [boardTotalCount, setBoardTotalCount] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 저장된 전략 목록 조회 (페이지 단위)
  const refreshBoard = useCallback(async (uid: string, page = 1) => {
    const res = await apiClient.post<ApiResponse<PageResponse<StrategyConfigDTO>>>(
      '/strategy/getStrategyConfigList',
      isAdmin
        ? { userUid: null, userName: '', email: '', permission: 0, status: 0, page, size: BOARD_SIZE }
        : { userUid: null, userName: '', email: '', permission: 0, status: 0, page: 1, size: 50 },
    );
    const items = res.data?.content.map(dtoToBoardItem) ?? [];
    // 일반 유저는 등급이 지정된 전략 메뉴만 표시 (menuGrade 오름차순)
    setBoard(isAdmin ? items : items.filter(item => item.menuGrade != null).sort((a, b) => (a.menuGrade ?? 99) - (b.menuGrade ?? 99)));
    setBoardTotalPage(res.data?.totalPage ?? 1);
    setBoardTotalCount(res.data?.totalCount ?? 0);
  }, [isAdmin]);

  useEffect(() => {
    const userUid = authStorage.get()?.userUid;
    if (!userUid) return;
    setBoardLoading(true);
    refreshBoard(userUid, 1).finally(() => setBoardLoading(false));
  }, [refreshBoard]);

  const handleBoardPageChange = useCallback(async (newPage: number) => {
    const userUid = authStorage.get()?.userUid;
    if (!userUid) return;
    setBoardPage(newPage);
    setBoardLoading(true);
    refreshBoard(userUid, newPage).finally(() => setBoardLoading(false));
  }, [refreshBoard]);


  const set = <K extends keyof CustomFormParams>(key: K, value: CustomFormParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const isFormComplete = toStrategyParams(params) !== null;

  // 저장 (항상 신규 insert)
  const handleSave = async () => {
    if (!title.trim()) return;
    const converted = toStrategyParams(params);
    if (!converted) return;
    const userUid = authStorage.get()?.userUid;
    if (!userUid) return;

    try {
      const dto = strategyToDto(converted, title.trim(), userUid, undefined, isAdmin ? menuGrade : null);
      const res = await apiClient.post<ApiResponse<StrategyConfigDTO>>('/strategy/insertStrategyConfig', dto);
      if (res.data?.id) setSelectedId(res.data.id);
      setBoardPage(1);
      await refreshBoard(userUid, 1);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* silent */ }
  };

  const handleReset = () => {
    setParams({ ...EMPTY_CUSTOM });
    setTitle('');
    setSaved(false);
    setSelectedId(null);
    setMenuGrade(null);
  };

  const handleBoardClick = (item: BoardItem) => {
    setSelectedId(null);
    setParams(item.params as unknown as CustomFormParams);
    setTitle(item.title);
    setMenuGrade(item.menuGrade ?? null);
  };

  const handleDeleteBoard = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const userUid = authStorage.get()?.userUid;
    if (!userUid) return;

    try {
      await apiClient.delete<ApiResponse<StrategyConfigDTO>>(
        '/strategy/deleteStrategyConfig',
        { id, userUid },
      );
      if (selectedId === id) { setSelectedId(null); setTitle(''); }
      await refreshBoard(userUid, boardPage);
    } catch { /* silent */ }
  };


  return (
    <PageLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">{isAdmin ? '전략 설정' : '전략 메뉴판'}</h1>

        {isAdmin ? (
          <div className="grid grid-cols-2 gap-6 items-start">
            <div className="min-w-0 space-y-6">
              <div className="space-y-2">
                <select
                  value={menuGrade ?? ''}
                  onChange={e => setMenuGrade(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">등급 없음 (일반 전략)</option>
                  <option value={1}>1등급 · 매우 강한 상승 (20~21점)</option>
                  <option value={2}>2등급 · 강한 상승 (17~19점)</option>
                  <option value={3}>3등급 · 상승 (14~16점)</option>
                  <option value={4}>4등급 · 기본/중립 (11~13점)</option>
                  <option value={5}>5등급 · 하락 (8~10점)</option>
                  <option value={6}>6등급 · 강한 하락 (5~7점)</option>
                  <option value={7}>7등급 · 매우 강한 하락 (3~4점)</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={e => { setTitle(e.target.value); setSaved(false); }}
                    placeholder="전략 제목을 입력하세요"
                    className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-base text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <button onClick={handleReset}
                    className="px-4 py-2 text-base bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
                    <i className="ri-refresh-line mr-1.5"></i>초기화
                  </button>
                  <button onClick={handleSave} disabled={!title.trim() || !isFormComplete}
                    className={`px-4 py-2 text-base font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
                      saved ? 'bg-green-600 text-white' : 'bg-teal-500 hover:bg-teal-400 text-white'
                    }`}>
                    {saved ? <><i className="ri-check-line mr-1.5"></i>저장됨</> : <><i className="ri-save-line mr-1.5"></i>저장</>}
                  </button>
                </div>
              </div>
              <CustomParamForm params={params} onChange={set} />
            </div>
            <div>
              <BoardPanel
                board={board}
                selectedId={selectedId}
                appliedItem={null}
                loading={boardLoading}
                startNo={boardTotalCount - (boardPage - 1) * BOARD_SIZE}
                onClickItem={handleBoardClick}
                onDeleteItem={handleDeleteBoard}
                onApplyItem={() => {}}
              />
              {boardTotalPage > 1 && (
                <Pagination currentPage={boardPage} totalPages={boardTotalPage} onPageChange={handleBoardPageChange} className="mt-3" />
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <i className="ri-layout-grid-line text-amber-400 text-lg"></i>
              <p className="text-sm text-zinc-400">
                시장 상황에 따라 자동으로 적용될 전략 메뉴판입니다. 항목을 클릭하면 상세 파라미터를 확인할 수 있습니다.
              </p>
            </div>
            <BoardPanel
              board={board}
              selectedId={null}
              appliedItem={null}
              loading={boardLoading}
              startNo={boardTotalCount}
              onClickItem={() => {}}
              onDeleteItem={() => {}}
              onApplyItem={() => {}}
              readOnly
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
}
