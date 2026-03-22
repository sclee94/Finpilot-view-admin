import { useState, useCallback } from 'react';
import PageLayout from '../../components/PageLayout';
import { apiClient } from '../../api/apiClient';
import type { ApiResponse } from '../../types';
import {
  type CustomFormParams, type BoardItem,
  EMPTY_CUSTOM, DEFAULT_PARAMS,
  BOARD_KEY, APPLIED_KEY,
  loadBoard, toStrategyParams,
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
  const [board, setBoard] = useState<BoardItem[]>(loadBoard);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [appliedItem, setAppliedItemState] = useState<BoardItem | null>(null);
  const setAppliedItem = (item: BoardItem | null) => {
    setAppliedItemState(item);
    if (item) localStorage.setItem(APPLIED_KEY, JSON.stringify(item));
    else localStorage.removeItem(APPLIED_KEY);
    window.dispatchEvent(new CustomEvent('strategyAppliedChanged', { detail: item }));
  };

  // 추천 탭
  const [recommended, setRecommended] = useState<StrategyParams>(DEFAULT_PARAMS);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [recTitle, setRecTitle] = useState('');
  const [recSaved, setRecSaved] = useState(false);

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

  const handleSave = () => {
    if (!title.trim()) return;
    const converted = toStrategyParams(params);
    if (!converted) return;
    const newItem: BoardItem = {
      id:     Date.now(),
      title:  title.trim(),
      symbol: converted.symbol,
      date:   new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      params: converted,
    };
    const updated = [newItem, ...board];
    setBoard(updated);
    localStorage.setItem(BOARD_KEY, JSON.stringify(updated));
    setSelectedId(newItem.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setParams({ ...EMPTY_CUSTOM });
    setTitle('');
    setSaved(false);
    setSelectedId(null);
  };

  const handleBoardClick = (item: BoardItem) => {
    setSelectedId(item.id);
    setParams(item.params as unknown as CustomFormParams);
    setTitle(item.title);
    setActiveTab('custom');
  };

  const handleDeleteBoard = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = board.filter(b => b.id !== id);
    setBoard(updated);
    localStorage.setItem(BOARD_KEY, JSON.stringify(updated));
    if (selectedId === id) { setSelectedId(null); setTitle(''); }
    if (appliedItem?.id === id) {
      setAppliedItemState(null);
      localStorage.removeItem(APPLIED_KEY);
      window.dispatchEvent(new CustomEvent('strategyAppliedChanged', { detail: null }));
    }
  };

  const handleApplyRecommended = () => {
    setParams(recommended as unknown as CustomFormParams);
    setActiveTab('custom');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRecSave = () => {
    if (!recTitle.trim()) return;
    const newItem: BoardItem = {
      id:     Date.now(),
      title:  recTitle.trim(),
      symbol: recommended.symbol,
      date:   new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      params: { ...recommended },
    };
    const updated = [newItem, ...board];
    setBoard(updated);
    localStorage.setItem(BOARD_KEY, JSON.stringify(updated));
    setSelectedId(newItem.id);
    setRecTitle('');
    setRecSaved(true);
    setTimeout(() => setRecSaved(false), 2000);
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
            <BoardPanel board={board} selectedId={selectedId} appliedItem={appliedItem}
              onClickItem={handleBoardClick} onDeleteItem={handleDeleteBoard} onApplyItem={setAppliedItem} />
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
            <BoardPanel board={board} selectedId={selectedId} appliedItem={appliedItem}
              onClickItem={handleBoardClick} onDeleteItem={handleDeleteBoard} onApplyItem={setAppliedItem} />
          </div>
        )}
      </div>
    </PageLayout>
  );
}
