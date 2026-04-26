import { useState, useCallback, useEffect, useRef } from 'react';
import PageLayout from '../../components/PageLayout';
import { apiClient } from '../../api/apiClient';
import { authStorage } from '../../utils/auth';
import { PERMISSIONS } from '../../constants';
import type { ApiResponse } from '../../types/index';
import { getBalance, getTradingSessionList } from '../../api/tradeApi';
import {
  type CustomFormParams,
  type BoardItem,
  type StrategyConfigDTO,
  EMPTY_CUSTOM, DEFAULT_PARAMS, APPLIED_KEY, SYMBOL_OPTIONS,
  dtoToBoardItem, strategyToDto, toStrategyParams,
} from './strategyTypes';
import CustomParamForm from './components/CustomParamForm';
import BoardPanel from './components/BoardPanel';
import { TabButton } from './components/StrategyFormFields';
import type { StrategyParams, NumVal } from './strategyTypes';

type TabType = 'custom' | 'recommend';

export default function Strategy() {
  const loginUser = authStorage.get();
  const isAdmin = (loginUser?.permission ?? 0) >= PERMISSIONS.ADMIN;

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
  const [backtestStrategyIds, setBacktestStrategyIds] = useState<Set<number>>(new Set());
  const [liveStrategyIds, setLiveStrategyIds] = useState<Set<number>>(new Set());
  const [paperStrategyIds, setPaperStrategyIds] = useState<Set<number>>(new Set());

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
  const [recommended, setRecommended] = useState<StrategyParams | null>(null);
  const [recStats, setRecStats] = useState<{
    backtestFrom?: string;
    backtestTo?: string;
    trades?: number;
    winRate?: number;
    totalReturnPct?: number;
    realizedPnl?: number;
    mdd?: number;
    sharpe?: number;
  } | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [recInput, setRecInput] = useState<{ symbol: string; initial_capital: NumVal; risk_per_trade: NumVal; use_prev_bar_signal: boolean; min_trades: NumVal }>({
    symbol: '', initial_capital: '', risk_per_trade: '', use_prev_bar_signal: true, min_trades: '',
  });
  const [recSymbolMode, setRecSymbolMode] = useState<'dropdown' | 'direct'>('dropdown');
  const [recDropdownValue, setRecDropdownValue] = useState('');
  const [recElapsed, setRecElapsed] = useState(0);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [balanceLoading, setBalanceLoading] = useState<'LIVE' | 'PAPER' | null>(null);

  const fetchBalance = useCallback(async (mode: 'LIVE' | 'PAPER') => {
    const stored = authStorage.get();
    if (!stored?.userUid) return;
    setBalanceLoading(mode);
    try {
      const accountNo = mode === 'PAPER' ? (stored.kisPaperAccountNo ?? undefined) : undefined;
      const res = await getBalance(stored.userUid, mode, accountNo);
      if (res && res.data?.balance !== undefined) {
        setRecInput(p => ({ ...p, initial_capital: res.data!.balance }));
      }
    } finally {
      setBalanceLoading(null);
    }
  }, []);

  // 저장된 전략 목록 조회 (isUse === 1 항목을 적용 상태로 자동 동기화)
  const refreshBoard = useCallback(async (uid: string) => {
    const res = await apiClient.post<ApiResponse<StrategyConfigDTO[]>>(
      '/strategy/getStrategyConfigList',
      isAdmin ? { userUid: null, userName: '', email: '', permission: 0, status: 0 } : { userUid: uid },
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

    if (isAdmin) return;
    // 백테스트 결과에서 사용된 전략 ID 수집
    apiClient.post<ApiResponse<{ strategyConfigId: number | null }[]>>(
      '/backtest/getBacktestList', { userUid },
    ).then(res => {
      const ids = new Set((res.data ?? []).map(r => r.strategyConfigId).filter((id): id is number => id !== null));
      setBacktestStrategyIds(ids);
    }).catch(() => {});
    // 실전/모의 세션에서 사용된 전략 ID 수집
    getTradingSessionList({ userUid }).then(res => {
      const sessions = res.data ?? [];
      setLiveStrategyIds(new Set(sessions.filter(s => s.mode === 'LIVE').map(s => s.strategyConfigId)));
      setPaperStrategyIds(new Set(sessions.filter(s => s.mode === 'PAPER').map(s => s.strategyConfigId)));
    }).catch(() => {});
  }, [refreshBoard, isAdmin]);

  const fetchRecommended = useCallback(() => {
    setRecLoading(true);
    setRecError(null);
    setRecElapsed(0);
    recTimerRef.current = setInterval(() => setRecElapsed(prev => prev + 1), 1000);
    apiClient.post<ApiResponse<StrategyParams>>('/finpilot/optimize', {
      symbol: recInput.symbol,
      initialCapital: Number(recInput.initial_capital),
      riskPerTrade: Number(recInput.risk_per_trade),
      usePrevBarSignal: recInput.use_prev_bar_signal,
      ...(recInput.min_trades !== '' && { minTrades: Number(recInput.min_trades) }),
    }, 5 * 60 * 1000)
      .then(res => {
        if (res && typeof res.status === 'number' && res.status < 400 && res.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const d = res.data as any;
          setRecStats({
            backtestFrom:   d.backtestFrom,
            backtestTo:     d.backtestTo,
            trades:         d.trades,
            winRate:        d.winRate,
            totalReturnPct: d.totalReturnPct,
            realizedPnl:    d.realizedPnl,
            mdd:            d.mdd,
            sharpe:         d.sharpe,
          });
          setRecommended({
            symbol:               d.symbol ?? recInput.symbol,
            adx_threshold:        d.adxThreshold,
            adx_persist:          d.adxPersist,
            rsi_long_entry:       d.rsiLongEntry,
            rsi_short_entry:      d.rsiShortEntry,
            atr_sl_mult:          d.atrSlMult,
            atr_tp_mult:          d.atrTpMult,
            min_hold_bars:        d.minHoldBars,
            sl_cooldown_bars:     d.slCooldownBars,
            consec_sl_limit:      d.consecSlLimit,
            max_dd_stop:          d.maxDdStop,
            commission:           d.commission,
            slippage:             d.slippage,
            risk_per_trade:       d.riskPerTrade,
            use_prev_bar_signal:  d.usePrevBarSignal,
            initial_capital:      d.initialCapital,
            indicator_window:     d.indicatorWindow,
            trading_days_per_year: d.tradingDaysPerYear,
            cooldown_bars_left:   d.cooldownBarsLeft ?? 0,
            consec_sl_count:      d.consecSlCount ?? 0,
            current_equity:       d.currentEquity ?? 0,
            peak_equity:          d.peakEquity ?? 0,
          });
        } else {
          setRecError(res?.message || '알 수 없는 오류가 발생했습니다.');
        }
      })
      .catch((err: unknown) => setRecError(err instanceof Error ? err.message : '서버 연결에 실패했습니다.'))
      .finally(() => {
        setRecLoading(false);
        if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null; }
      });
  }, [recInput]);

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

  const riskPerTradeNum = recInput.risk_per_trade === '' ? NaN : Number(recInput.risk_per_trade);
  const isRiskPerTradeValid = !isNaN(riskPerTradeNum) && riskPerTradeNum >= 0.005 && riskPerTradeNum <= 0.03;
  const isRecInputComplete = !!recInput.symbol && recInput.initial_capital !== '' && recInput.risk_per_trade !== '' && isRiskPerTradeValid;
  const isRecComplete = !!recommended && isRecInputComplete;

  const handleApplyRecommended = () => {
    if (!recommended || !isRecComplete) return;
    setParams(recommended as unknown as CustomFormParams);
    setActiveTab('custom');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">전략 설정</h1>

        {isAdmin ? (
          <BoardPanel
            board={board}
            selectedId={null}
            appliedItem={null}
            loading={boardLoading}
            onClickItem={() => {}}
            onDeleteItem={() => {}}
            onApplyItem={() => {}}
            readOnly
          />
        ) : (
          <>
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
              backtestStrategyIds={backtestStrategyIds}
              liveStrategyIds={liveStrategyIds}
              paperStrategyIds={paperStrategyIds}
            />
          </div>
        )}

        {activeTab === 'recommend' && (
          <div className="grid grid-cols-2 gap-6 items-start">
            <div className="min-w-0 space-y-6">
              <div className="flex gap-2">
                <button onClick={fetchRecommended} disabled={recLoading || !isRecInputComplete}
                  className="px-4 py-2 text-base bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                  <i className={`ri-magic-line mr-1.5 ${recLoading ? 'animate-spin' : ''}`}></i>추천받기
                </button>
              </div>

              {/* 최적화 입력값 */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-zinc-800 bg-zinc-800/40 rounded-t-xl">
                  <i className="ri-settings-3-line text-teal-400 text-xl"></i>
                  <h2 className="text-lg font-semibold text-zinc-200">최적화 입력값</h2>
                  <span className="text-red-400 text-sm ml-1">* 필수 입력</span>
                </div>
                <div className="p-6 space-y-4">
                  {/* 종목 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-medium text-zinc-300">종목 <span className="text-red-400">*</span></span>
                      <div className="ml-auto flex bg-zinc-800 rounded-md p-0.5 gap-0.5">
                        <button type="button"
                          onClick={() => { setRecSymbolMode('dropdown'); setRecDropdownValue(''); setRecInput(p => ({ ...p, symbol: '' })); }}
                          className={`px-3 py-1 text-sm rounded transition-colors cursor-pointer ${recSymbolMode === 'dropdown' ? 'bg-teal-500 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
                          선택
                        </button>
                        <button type="button"
                          onClick={() => { setRecSymbolMode('direct'); setRecInput(p => ({ ...p, symbol: '' })); }}
                          className={`px-3 py-1 text-sm rounded transition-colors cursor-pointer ${recSymbolMode === 'direct' ? 'bg-teal-500 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
                          직접입력
                        </button>
                      </div>
                    </div>
                    {recSymbolMode === 'dropdown' ? (
                      <select value={recDropdownValue}
                        onChange={e => { setRecDropdownValue(e.target.value); setRecInput(p => ({ ...p, symbol: e.target.value })); }}
                        className="w-full px-3 py-2.5 border rounded-lg text-lg focus:outline-none transition-colors bg-zinc-800 border-zinc-700 text-zinc-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                        <option value="" disabled>— 종목을 선택하세요 —</option>
                        {Object.entries(
                          SYMBOL_OPTIONS.reduce<Record<string, typeof SYMBOL_OPTIONS>>((acc, o) => {
                            (acc[o.group] ??= []).push(o); return acc;
                          }, {})
                        ).map(([g, opts]) => (
                          <optgroup key={g} label={g}>
                            {opts.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    ) : (
                      <input type="text" value={recInput.symbol}
                        onChange={e => setRecInput(p => ({ ...p, symbol: e.target.value }))}
                        placeholder="종목 코드를 입력하세요 (예: 005930.KS)"
                        className="w-full px-3 py-2.5 border rounded-lg text-lg text-zinc-200 focus:outline-none transition-colors bg-zinc-800 border-zinc-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-zinc-600" />
                    )}
                  </div>
                  {/* 자본금 / 위험비율 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-lg font-medium text-zinc-300">초기 자본금 (원) <span className="text-red-400">*</span></span>
                      <input type="number" value={recInput.initial_capital} step={1000000} min={0}
                        placeholder="값을 입력하세요"
                        onChange={e => { const v = e.target.value; setRecInput(p => ({ ...p, initial_capital: v === '' ? '' : (parseInt(v) || '') })); }}
                        className="w-full px-3 py-2.5 border rounded-lg text-lg text-zinc-200 focus:outline-none transition-colors bg-zinc-800 border-zinc-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-zinc-600" />
                      <div className="flex gap-2 pt-0.5">
                        <button type="button" onClick={() => fetchBalance('LIVE')} disabled={balanceLoading !== null}
                          className="flex-1 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          {balanceLoading === 'LIVE' ? <i className="ri-loader-4-line animate-spin mr-1" /> : <i className="ri-bank-line mr-1" />}실거래 자본금 가져오기
                        </button>
                        <button type="button" onClick={() => fetchBalance('PAPER')} disabled={balanceLoading !== null}
                          className="flex-1 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          {balanceLoading === 'PAPER' ? <i className="ri-loader-4-line animate-spin mr-1" /> : <i className="ri-file-copy-line mr-1" />}모의거래 자본금 가져오기
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-lg font-medium text-zinc-300">거래당 위험 비율 <span className="text-red-400">*</span></span>
                      <input type="number" value={recInput.risk_per_trade} step={0.001} min={0.005} max={0.03}
                        placeholder="0.005 ~ 0.03"
                        onChange={e => { const v = e.target.value; setRecInput(p => ({ ...p, risk_per_trade: v === '' ? '' : (parseFloat(v) || '') })); }}
                        className={`w-full px-3 py-2.5 border rounded-lg text-lg text-zinc-200 focus:outline-none transition-colors bg-zinc-800 focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-zinc-600 ${recInput.risk_per_trade !== '' && !isRiskPerTradeValid ? 'border-red-500' : 'border-zinc-700'}`} />
                      {recInput.risk_per_trade !== '' && !isRiskPerTradeValid
                        ? <p className="text-sm text-red-400">0.005 ~ 0.03 범위로 입력해주세요</p>
                        : <p className="text-sm text-teal-500">권장 범위: 0.005 (0.5%) ~ 0.03 (3%)</p>
                      }
                    </div>
                  </div>
                  {/* 최소 거래 횟수 */}
                  <div className="space-y-1.5">
                    <span className="text-lg font-medium text-zinc-300">최소 거래 횟수</span>
                    <input type="number" value={recInput.min_trades} step={1} min={1}
                      placeholder="미입력 시 기본값 사용"
                      onChange={e => { const v = e.target.value; setRecInput(p => ({ ...p, min_trades: v === '' ? '' : (parseInt(v) || '') })); }}
                      className="w-full px-3 py-2.5 border rounded-lg text-lg text-zinc-200 focus:outline-none transition-colors bg-zinc-800 border-zinc-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-zinc-600" />
                    <p className="text-sm text-zinc-500">백테스트 최적화 시 허용할 최소 거래 횟수</p>
                  </div>
                  {/* 이전 봉 신호 사용 */}
                  <div className="flex items-center justify-between gap-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                    <div>
                      <span className="text-lg font-medium text-zinc-300">이전 봉 신호 사용</span>
                      <p className="text-sm text-teal-500 mt-0.5">권장 설정입니다 (룩어헤드 바이어스 방지)</p>
                    </div>
                    <button type="button"
                      onClick={() => setRecInput(p => ({ ...p, use_prev_bar_signal: !p.use_prev_bar_signal }))}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${recInput.use_prev_bar_signal ? 'bg-teal-500' : 'bg-zinc-600'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${recInput.use_prev_bar_signal ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {recError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <i className="ri-error-warning-line text-red-400"></i>
                  <p className="text-sm text-red-400">{recError}</p>
                </div>
              )}

              {recLoading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 bg-zinc-900 rounded-xl border border-zinc-800">
                  <i className="ri-loader-4-line animate-spin text-teal-400 text-4xl"></i>
                  <p className="text-zinc-300 font-medium">최적화 분석 중...</p>
                  <p className="text-zinc-500 text-sm">
                    경과 시간: {String(Math.floor(recElapsed / 60)).padStart(2, '0')}:{String(recElapsed % 60).padStart(2, '0')}
                    &nbsp;/ 최대 5분 소요될 수 있습니다
                  </p>
                </div>
              ) : recommended && (
                <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl px-5 py-4 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <i className="ri-check-double-line text-teal-400 text-2xl shrink-0"></i>
                      <div>
                        <p className="text-teal-300 font-semibold">추천 완료!</p>
                        <p className="text-zinc-400 text-sm mt-0.5">아래 결과를 확인하고 커스텀에 적용해 보세요.</p>
                      </div>
                    </div>
                    <button onClick={handleApplyRecommended} disabled={!isRecComplete}
                      className="px-4 py-2 text-sm font-semibold bg-teal-500 hover:bg-teal-400 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed">
                      <i className="ri-download-line mr-1.5"></i>커스텀에 적용
                    </button>
                  </div>
                  {recStats && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 col-span-2">
                        <p className="text-xs text-zinc-500 mb-1">백테스트 기간</p>
                        <p className="text-sm font-semibold text-zinc-200">
                          {recStats.backtestFrom && recStats.backtestTo
                            ? (() => {
                                const days = Math.round((new Date(recStats.backtestTo).getTime() - new Date(recStats.backtestFrom).getTime()) / 86400000);
                                return `${recStats.backtestFrom} ~ ${recStats.backtestTo} (총 ${days}일)`;
                              })()
                            : '-'}
                        </p>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                        <p className="text-xs text-zinc-500 mb-1">거래수</p>
                        <p className="text-sm font-semibold text-zinc-200">{recStats.trades != null ? `${recStats.trades}건` : '-'}</p>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                        <p className="text-xs text-zinc-500 mb-1">성공률</p>
                        <p className="text-sm font-semibold text-teal-400">
                          {recStats.winRate != null ? `${Number(recStats.winRate).toFixed(1)}%` : '-'}
                        </p>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                        <p className="text-xs text-zinc-500 mb-1">총 수익률</p>
                        <p className={`text-sm font-semibold ${recStats.totalReturnPct != null ? (recStats.totalReturnPct >= 0 ? 'text-teal-400' : 'text-red-400') : 'text-zinc-200'}`}>
                          {recStats.totalReturnPct != null
                            ? `${recStats.totalReturnPct >= 0 ? '+' : ''}${Number(recStats.totalReturnPct).toFixed(2)}%`
                            : '-'}
                        </p>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                        <p className="text-xs text-zinc-500 mb-1">실현손익</p>
                        <p className={`text-sm font-semibold ${recStats.realizedPnl != null ? (recStats.realizedPnl >= 0 ? 'text-teal-400' : 'text-red-400') : 'text-zinc-200'}`}>
                          {recStats.realizedPnl != null
                            ? `${recStats.realizedPnl >= 0 ? '+' : ''}${recStats.realizedPnl.toLocaleString()}`
                            : '-'}
                        </p>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                        <p className="text-xs text-zinc-500 mb-1">최대 낙폭</p>
                        <p className="text-sm font-semibold text-red-400">
                          {recStats.mdd != null ? `-${Number(recStats.mdd).toFixed(2)}%` : '-'}
                        </p>
                      </div>
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                        <p className="text-xs text-zinc-500 mb-1">샤프 비율</p>
                        <p className="text-sm font-semibold text-zinc-200">
                          {recStats.sharpe != null ? Number(recStats.sharpe).toFixed(3) : '-'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
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
              backtestStrategyIds={backtestStrategyIds}
              liveStrategyIds={liveStrategyIds}
              paperStrategyIds={paperStrategyIds}
            />
          </div>
        )}
          </>
        )}
      </div>
    </PageLayout>
  );
}
