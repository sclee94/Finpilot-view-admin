import { useState, useCallback, useEffect } from 'react';
import PageLayout from '../../components/PageLayout';
import { apiClient } from '../../api/apiClient';
import { authStorage } from '../../utils/auth';
import type { ApiResponse } from '../../types/index';
import {
  type CustomFormParams,
  type BoardItem,
  type StrategyConfigDTO,
  EMPTY_CUSTOM, DEFAULT_PARAMS, APPLIED_KEY,
  dtoToBoardItem, strategyToDto, toStrategyParams,
} from './strategyTypes';
import CustomParamForm from './components/CustomParamForm';
import ReadOnlyParamForm from './components/ReadOnlyParamForm';
import BoardPanel from './components/BoardPanel';
import { TabButton } from './components/StrategyFormFields';
import type { StrategyParams } from './strategyTypes';

type TabType = 'custom' | 'recommend';

export default function Strategy() {
  const [activeTab, setActiveTab] = useState<TabType>('custom');

  // 커스텀 탭
  const [params, setParams] = useState<CustomFormParams>({ ...EMPTY_CUSTOM });
  const [title, setTitle] = useState('');
  const [saved, setSaved] = useState(false);

  // 게시판
  const [board, setBoard] = useState<BoardItem[]>([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [appliedItem, setAppliedItemState] = useState<BoardItem | null>(null);

  const setAppliedItem = useCallback(async (item: BoardItem | null) => {
    const userUid = authStorage.get()?.userUid;
    if (!userUid) return;
    try {
      // 기존 적용 항목 해제
      if (appliedItem && (!item || appliedItem.id !== item.id)) {
        await apiClient.put<ApiResponse<StrategyConfigDTO>>('/strategy/updateStrategyConfig', {
          id: appliedItem.id, userUid, isUse: 0,
        });
      }
      // 새 항목 적용
      if (item) {
        await apiClient.put<ApiResponse<StrategyConfigDTO>>('/strategy/updateStrategyConfig', {
          id: item.id, userUid, isUse: 1,
        });
      }
      setAppliedItemState(item);
      if (item) localStorage.setItem(APPLIED_KEY, JSON.stringify(item));
      else localStorage.removeItem(APPLIED_KEY);
      window.dispatchEvent(new CustomEvent('strategyAppliedChanged', { detail: item }));
    } catch { /* silent */ }
  }, [appliedItem]);

  // 추천 탭
  const [recommended, setRecommended] = useState<StrategyParams>(DEFAULT_PARAMS);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [recTitle, setRecTitle] = useState('');
  const [recSaved, setRecSaved] = useState(false);

  // 저장된 전략 목록 조회 (isUse === 1 항목을 적용 상태로 자동 동기화)
  const refreshBoard = useCallback(async (uid: string) => {
    const res = await apiClient.post<ApiResponse<StrategyConfigDTO[]>>(
      '/strategy/getStrategyConfigList',
      { userUid: uid },
    );
    const items = res.data ? res.data.map(dtoToBoardItem) : [];
    setBoard(items);
    const applied = items.find(b => b.isUse === 1) ?? null;
    setAppliedItemState(applied);
    if (applied) localStorage.setItem(APPLIED_KEY, JSON.stringify(applied));
    else localStorage.removeItem(APPLIED_KEY);
    window.dispatchEvent(new CustomEvent('strategyAppliedChanged', { detail: applied }));
  }, []);

  useEffect(() => {
    const userUid = authStorage.get()?.userUid;
    if (!userUid) return;
    setBoardLoading(true);
    refreshBoard(userUid).finally(() => setBoardLoading(false));
  }, [refreshBoard]);

  const fetchRecommended = useCallback(() => {
    setRecLoading(true);
    setRecError(null);
    apiClient.get<ApiResponse<StrategyParams>>('/strategy/recommend')
      .then(res => {
        if (res && typeof res.status === 'number' && res.status < 400 && res.data) {
          setRecommended(res.data);
        } else {
          setRecError(res?.message || '알 수 없는 오류가 발생했습니다.');
        }
      })
      .catch(() => setRecError('서버 연결에 실패했습니다.'))
      .finally(() => setRecLoading(false));
  }, []);

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
      const dto = strategyToDto(converted, title.trim(), userUid);
      const res = await apiClient.post<ApiResponse<StrategyConfigDTO>>('/strategy/insertStrategyConfig', dto);
      if (res.data?.id) setSelectedId(res.data.id);
      await refreshBoard(userUid);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* silent */ }
  };

  const handleReset = () => {
    setParams({ ...EMPTY_CUSTOM });
    setTitle('');
    setSaved(false);
    setSelectedId(null);
  };

  const handleBoardClick = (item: BoardItem) => {
    setSelectedId(null);
    setParams(item.params as unknown as CustomFormParams);
    setTitle(item.title);
    setActiveTab('custom');
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
      setBoard(prev => prev.filter(b => b.id !== id));
      if (selectedId === id) { setSelectedId(null); setTitle(''); }
      if (appliedItem?.id === id) {
        setAppliedItemState(null);
        localStorage.removeItem(APPLIED_KEY);
        window.dispatchEvent(new CustomEvent('strategyAppliedChanged', { detail: null }));
      }
    } catch { /* silent */ }
  };

  const handleApplyRecommended = () => {
    setParams(recommended as unknown as CustomFormParams);
    setActiveTab('custom');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // 추천 전략 저장 (항상 신규 insert)
  const handleRecSave = async () => {
    if (!recTitle.trim()) return;
    const userUid = authStorage.get()?.userUid;
    if (!userUid) return;

    const dto = strategyToDto(recommended, recTitle.trim(), userUid);
    try {
      const res = await apiClient.post<ApiResponse<StrategyConfigDTO>>('/strategy/insertStrategyConfig', dto);
      if (res.data?.id) setSelectedId(res.data.id);
      await refreshBoard(userUid);
      setRecTitle('');
      setRecSaved(true);
      setTimeout(() => setRecSaved(false), 2000);
    } catch { /* silent */ }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">전략 설정</h1>

        <div className="flex bg-zinc-800 rounded-lg p-1 gap-1 w-fit">
          <TabButton active={activeTab === 'custom'} onClick={() => setActiveTab('custom')}>
            <i className="ri-edit-line mr-1.5"></i>커스텀
          </TabButton>
          <TabButton active={activeTab === 'recommend'} onClick={() => setActiveTab('recommend')}>
            <i className="ri-magic-line mr-1.5"></i>추천
          </TabButton>
        </div>

        {activeTab === 'custom' && (
          <div className="grid grid-cols-2 gap-6 items-start">
            <div className="min-w-0 space-y-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={e => { setTitle(e.target.value); setSaved(false); }}
                  placeholder="설정 제목을 입력하세요"
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
              <CustomParamForm params={params} onChange={set} />
            </div>
            <BoardPanel
              board={board}
              selectedId={selectedId}
              appliedItem={appliedItem}
              loading={boardLoading}
              onClickItem={handleBoardClick}
              onDeleteItem={handleDeleteBoard}
              onApplyItem={setAppliedItem}
            />
          </div>
        )}

        {activeTab === 'recommend' && (
          <div className="grid grid-cols-2 gap-6 items-start">
            <div className="min-w-0 space-y-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={recTitle}
                  onChange={e => { setRecTitle(e.target.value); setRecSaved(false); }}
                  placeholder="저장할 설정 제목을 입력하세요"
                  className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-base text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <button onClick={fetchRecommended} disabled={recLoading}
                  className="px-4 py-2 text-base bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50">
                  <i className={`ri-refresh-line mr-1.5 ${recLoading ? 'animate-spin' : ''}`}></i>새로고침
                </button>
                <button onClick={handleApplyRecommended}
                  className="px-4 py-2 text-base font-semibold bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap">
                  <i className="ri-download-line mr-1.5"></i>커스텀에 적용
                </button>
                <button onClick={handleRecSave} disabled={!recTitle.trim()}
                  className={`px-4 py-2 text-base font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
                    recSaved ? 'bg-green-600 text-white' : 'bg-teal-500 hover:bg-teal-400 text-white'
                  }`}>
                  {recSaved ? <><i className="ri-check-line mr-1.5"></i>저장됨</> : <><i className="ri-save-line mr-1.5"></i>저장</>}
                </button>
              </div>

              {recError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <i className="ri-error-warning-line text-red-400"></i>
                  <p className="text-sm text-red-400">{recError} — 기본 추천값을 표시합니다.</p>
                </div>
              )}

              {recLoading ? (
                <div className="flex items-center justify-center h-48 text-zinc-500">
                  <i className="ri-loader-4-line animate-spin text-2xl mr-2"></i>추천값 불러오는 중...
                </div>
              ) : (
                <ReadOnlyParamForm params={recommended} />
              )}
            </div>
            <BoardPanel
              board={board}
              selectedId={selectedId}
              appliedItem={appliedItem}
              loading={boardLoading}
              onClickItem={handleBoardClick}
              onDeleteItem={handleDeleteBoard}
              onApplyItem={setAppliedItem}
            />
          </div>
        )}
      </div>
    </PageLayout>
  );
}
