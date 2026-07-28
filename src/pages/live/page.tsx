import { useState, useEffect, useCallback } from 'react';
import PageLayout from '../../components/PageLayout';
import { authStorage } from '../../utils/auth';
import { PERMISSIONS } from '../../constants';
import type { ApiResponse, TradingSession, TradeHistory } from '../../types/index';
import type { StrategyConfigDTO } from '../strategy/strategyTypes';
import { SYMBOL_OPTIONS } from '../strategy/strategyTypes';
import { getSymbolName } from '../../constants/symbolNames';
import { apiClient } from '../../api/apiClient';
import {
  getExecuteOnOff,
  setExecuteOnOff,
  getTradingSessionList,
  insertTradingSession,
  updateTradingSession,
  deleteTradingSession,
  resetTradingSession,
  getTradeHistoryList,
  updateSessionStrategyConfigId,
  syncPosition,
  adjustCapital,
  toggleForceCloseEnabled,
} from '../../api/tradeApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function positionBadge(pos: TradingSession['currentPosition']) {
  if (pos === 'LONG') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300">LONG</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-700 text-zinc-400">NONE</span>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Live() {
  const loginUser = authStorage.get();
  const isAdmin = (loginUser?.permission ?? 0) >= PERMISSIONS.ADMIN;

  const [investSymbol,       setInvestSymbol]       = useState('');
  const [investSymbolMode,   setInvestSymbolMode]   = useState<'dropdown' | 'direct'>('dropdown');
  const [investDropdown,     setInvestDropdown]     = useState('');
  const [investing,          setInvesting]          = useState(false);
  const [sessionList, setSessionList]   = useState<TradingSession[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [errorMessage, setErrorMessage]   = useState('');

  // 투자 모드 (기본값 없음)
  const [investMode, setInvestMode] = useState<'LIVE' | 'PAPER' | null>(null);

  // 진행 섹션 탭
  const [sessionTab, setSessionTab] = useState<'LIVE' | 'PAPER'>('LIVE');

  // 중지/재실행/삭제 확인 팝업
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: 'stop' | 'resume' | 'delete' | 'reset' } | null>(null);

  // 15:18 강제청산 적용 여부 토글 (optimistic)
  const [forceCloseMap, setForceCloseMap] = useState<Record<string, boolean>>({});

  const handleToggleForceClose = async (session: TradingSession) => {
    const next = !(forceCloseMap[session.id] ?? (session.isForceCloseEnabled !== 0));
    setForceCloseMap(prev => ({ ...prev, [session.id]: next }));
    try {
      await toggleForceCloseEnabled(session.id);
    } catch {
      setForceCloseMap(prev => ({ ...prev, [session.id]: !next }));
    }
  };

  // 전략 변경 팝업
  const [strategyChangePopup, setStrategyChangePopup] = useState<{ sessionId: string; currentStrategyId: number | null; currentStrategyTitle: string } | null>(null);
  const [strategyList, setStrategyList] = useState<StrategyConfigDTO[]>([]);
  const [strategyListLoading, setStrategyListLoading] = useState(false);
  const [selectedNewStrategy, setSelectedNewStrategy] = useState<StrategyConfigDTO | null>(null);

  const openStrategyChangePopup = useCallback(async (sessionId: string, currentStrategyId: number | null, currentStrategyTitle: string) => {
    setStrategyChangePopup({ sessionId, currentStrategyId, currentStrategyTitle });
    setSelectedNewStrategy(null);
    const userUid = authStorage.get()?.userUid;
    if (!userUid) return;
    setStrategyListLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<import('../../types').PageResponse<StrategyConfigDTO>>>(
        '/strategy/getStrategyConfigList',
        { userUid },
      );
      setStrategyList(res.data?.content ?? []);
    } catch { /* silent */ } finally {
      setStrategyListLoading(false);
    }
  }, []);

  const handleStrategyChange = async () => {
    if (!strategyChangePopup || !selectedNewStrategy?.id) return;
    const { sessionId } = strategyChangePopup;
    const newStrategy = selectedNewStrategy;
    try {
      await updateSessionStrategyConfigId({ id: sessionId, strategyConfigId: newStrategy.id });
      // API가 갱신된 세션을 돌려주지 않아서, 이미 들고 있는 선택된 전략 객체로 즉시 반영 (재조회 없이 화면 즉시 갱신)
      setSessionList(prev => prev.map(s => s.id === sessionId ? {
        ...s,
        strategyConfigId: newStrategy.id!,
        strategyConfig: {
          id:                  newStrategy.id!,
          name:                newStrategy.name,
          takeProfitPct:       newStrategy.takeProfitPct,
          stopLossPct:         newStrategy.stopLossPct,
          pullbackMinPct:      newStrategy.pullbackMinPct,
          pullbackMaxPct:      newStrategy.pullbackMaxPct,
          buyingVolumeRatio:   newStrategy.buyingVolumeRatio,
          stopLossVolumeRatio: newStrategy.stopLossVolumeRatio,
          pullbackVolumeRatio: newStrategy.pullbackVolumeRatio,
        },
      } : s));
      setStrategyChangePopup(null);
      setSelectedNewStrategy(null);
    } catch {
      setErrorMessage('전략 변경에 실패했습니다.');
    }
  };

  // 자본금 조정 팝업 — 입금/출금 시 포지션·수익 이력은 유지한 채 수익률 기준점만 증감
  const [capitalPopup, setCapitalPopup] = useState<{ sessionId: string } | null>(null);
  const [capitalAmount, setCapitalAmount] = useState('');
  const [capitalSubmitting, setCapitalSubmitting] = useState(false);

  const handleAdjustCapital = async () => {
    if (!capitalPopup) return;
    const amount = parseFloat(capitalAmount.replace(/,/g, ''));
    if (isNaN(amount) || amount === 0) { setErrorMessage('올바른 금액을 입력해주세요.'); return; }
    setCapitalSubmitting(true);
    try {
      const res = await adjustCapital(capitalPopup.sessionId, amount);
      if (res.data) {
        const updated = res.data;
        setSessionList(prev => prev.map(s => s.id === capitalPopup.sessionId ? updated : s));
        setCapitalPopup(null);
        setCapitalAmount('');
      } else {
        setErrorMessage(res.message || '자본금 조정에 실패했습니다.');
      }
    } catch {
      setErrorMessage('자본금 조정에 실패했습니다.');
    } finally {
      setCapitalSubmitting(false);
    }
  };

  // 거래 리스트 팝업
  const [tradePopup, setTradePopup] = useState<{ symbol: string; symbolName: string; userUid: string; mode: 'LIVE' | 'PAPER' } | null>(null);
  const [tradePopupList, setTradePopupList] = useState<TradeHistory[]>([]);
  const [tradePopupLoading, setTradePopupLoading] = useState(false);
  const [tradePopupDetail, setTradePopupDetail] = useState<TradeHistory | null>(null);
  const [tradePopupDateFrom, setTradePopupDateFrom] = useState('');
  const [tradePopupDateTo, setTradePopupDateTo] = useState('');

  useEffect(() => {
    if (!tradePopup) return;
    setTradePopupDateFrom('');
    setTradePopupDateTo('');
    setTradePopupLoading(true);
    getTradeHistoryList({ userUid: tradePopup.userUid, symbol: tradePopup.symbol, mode: tradePopup.mode })
      .then(res => {
        setTradePopupList(res.data?.content ?? []);
      })
      .catch(() => setTradePopupList([]))
      .finally(() => setTradePopupLoading(false));
  }, [tradePopup]);

  const [adminToggle, setAdminToggle] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    getExecuteOnOff()
      .then(res => {
        if (res.data != null) setAdminToggle(res.data.isEnabled === 1);
      })
      .catch(() => {});
  }, [isAdmin]);

  const handleAdminToggle = async () => {
    const userUid = authStorage.get()?.userUid;
    if (!userUid) return;
    const newValue = !adminToggle;
    setAdminToggle(newValue);
    try {
      const res = await setExecuteOnOff(newValue ? 1 : 0, userUid);
      if (res.data != null) setAdminToggle(res.data.isEnabled === 1);
    } catch {
      setAdminToggle(!newValue);
    }
  };

  // 진행 세션 목록 조회 (silent=true면 스피너로 리스트를 갈아엎지 않고 조용히 갱신 — 액션 후 후속 새로고침용)
  const fetchSessionList = useCallback(async (silent = false) => {
    const userUid = authStorage.get()?.userUid;
    if (!isAdmin && !userUid) return;
    if (!silent) setStatusLoading(true);
    try {
      const res = await getTradingSessionList(
        isAdmin ? { userUid, viewAll: true } : { userUid },
      );
      setSessionList(res.data ?? []);
    } catch { /* silent */ } finally {
      if (!silent) setStatusLoading(false);
    }
  }, [isAdmin]);

  // 세션 생성 — 현재 활성 전략 설정(싱글톤)을 조회해 strategyConfigId로 연결
  const handleCreateSession = async () => {
    if (!investSymbol.trim() || !investMode || investing) return;
    const userUid = authStorage.get()?.userUid;
    if (!userUid) return;

    setInvesting(true);
    setErrorMessage('');
    try {
      const strategyRes = await apiClient.post<ApiResponse<import('../../types').PageResponse<StrategyConfigDTO>>>(
        '/strategy/getStrategyConfigList',
        {},
      );
      const strategyConfigId = strategyRes.data?.content?.[0]?.id ?? null;

      const res = await insertTradingSession({
        userUid,
        symbol: investSymbol.trim().toUpperCase(),
        mode:   investMode,
        strategyConfigId,
      });
      if (res.data) {
        // 생성 응답엔 strategyConfig/symbolName 조인 정보가 없어 조용히 재조회해서 정확한 값으로 채움
        await fetchSessionList(true);
        setInvestSymbol('');
        setInvestDropdown('');
      } else {
        setErrorMessage(res.message || '세션 생성에 실패했습니다.');
      }
    } catch {
      setErrorMessage('서버 연결에 실패했습니다.');
    } finally {
      setInvesting(false);
    }
  };

  // KIS 실잔고 동기화
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const handleSyncPosition = async (id: string) => {
    setSyncingId(id);
    try {
      const res = await syncPosition(id);
      if (res.data) {
        const updated = res.data;
        setSessionList(prev => prev.map(s => s.id === id ? updated : s));
      } else {
        setErrorMessage(res.message || '실잔고 동기화에 실패했습니다.');
      }
    } catch {
      setErrorMessage('실잔고 동기화에 실패했습니다.');
    } finally {
      setSyncingId(null);
    }
  };

  // 마운트 시 진행 세션 목록 조회
  useEffect(() => {
    fetchSessionList();
  }, [fetchSessionList]);

  // 세션 중지 (active: 0) — 값을 이미 알고 있으므로 즉시 반영, 실패 시 되돌림
  const handleStopSession = async (id: string) => {
    setSessionList(prev => prev.map(s => s.id === id ? { ...s, active: 0 } : s));
    try {
      await updateTradingSession({ id, active: 0 });
    } catch {
      setSessionList(prev => prev.map(s => s.id === id ? { ...s, active: 1 } : s));
      setErrorMessage('세션 중지에 실패했습니다.');
    }
  };

  // 세션 재실행 (active: 1)
  const handleResumeSession = async (id: string) => {
    setSessionList(prev => prev.map(s => s.id === id ? { ...s, active: 1 } : s));
    try {
      await updateTradingSession({ id, active: 1 });
    } catch {
      setSessionList(prev => prev.map(s => s.id === id ? { ...s, active: 0 } : s));
      setErrorMessage('세션 재실행에 실패했습니다.');
    }
  };

  // 세션 삭제 — 즉시 목록에서 제거, 실패 시 복원
  const handleDeleteSession = async (id: string) => {
    const removed = sessionList.find(s => s.id === id);
    setSessionList(prev => prev.filter(s => s.id !== id));
    try {
      await deleteTradingSession(id);
    } catch {
      if (removed) setSessionList(prev => [...prev, removed]);
      setErrorMessage('세션 삭제에 실패했습니다.');
    }
  };

  // 세션 초기화 — 응답에 갱신된 값이 없어 조용히(스피너 없이) 재조회
  const handleResetSession = async (id: string) => {
    try {
      await resetTradingSession(id);
      await fetchSessionList(true);
    } catch {
      setErrorMessage('세션 초기화에 실패했습니다.');
    }
  };

  // 보유 수량 1주 이상인 세션을 상단에 노출
  const visibleSessions = sessionList
    .filter(s => s.mode === sessionTab)
    .sort((a, b) => (((b.sharesHeld ?? 0) >= 1) ? 1 : 0) - (((a.sharesHeld ?? 0) >= 1) ? 1 : 0));

  return (
    <PageLayout>
      {/* 전략 변경 팝업 */}
      {strategyChangePopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60" onClick={() => { setStrategyChangePopup(null); setSelectedNewStrategy(null); }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
              <div>
                <h2 className="text-base font-bold text-zinc-100">전략 변경</h2>
                <p className="text-xs text-zinc-500 mt-0.5">현재: <span className="text-zinc-300">{strategyChangePopup.currentStrategyTitle || '-'}</span></p>
              </div>
              <button
                onClick={() => { setStrategyChangePopup(null); setSelectedNewStrategy(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-zinc-400 text-lg"></i>
              </button>
            </div>

            {/* 전략 목록 */}
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
              {strategyListLoading ? (
                <div className="flex items-center justify-center py-10">
                  <i className="ri-loader-4-line animate-spin text-teal-400 text-2xl"></i>
                </div>
              ) : strategyList.length === 0 ? (
                <div className="py-10 text-center text-zinc-500 text-sm">
                  <i className="ri-inbox-line text-3xl block mb-2"></i>
                  전략이 없습니다
                </div>
              ) : (
                strategyList.map(strategy => {
                  const isCurrent = strategy.id === strategyChangePopup.currentStrategyId;
                  const isSelected = selectedNewStrategy?.id === strategy.id;
                  return (
                    <button
                      key={strategy.id}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => !isCurrent && setSelectedNewStrategy(isSelected ? null : strategy)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                        isCurrent
                          ? 'border-amber-500/30 bg-amber-500/5 cursor-not-allowed'
                          : isSelected
                          ? 'border-teal-500 bg-teal-500/10 cursor-pointer'
                          : 'border-zinc-700/50 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/60 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-sm font-semibold truncate ${isCurrent ? 'text-amber-300' : isSelected ? 'text-teal-300' : 'text-zinc-200'}`}>
                            {strategy.name || `전략 #${strategy.id}`}
                          </span>
                          {isCurrent && (
                            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">적용중</span>
                          )}
                          {isSelected && (
                            <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400">선택됨</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {strategy.buyingVolumeRatio != null && (
                            <span className="text-xs text-zinc-500 bg-zinc-700 px-2 py-0.5 rounded">거래량 {strategy.buyingVolumeRatio}%</span>
                          )}
                        </div>
                      </div>
                      {strategy.createdAt && (
                        <p className="text-xs text-zinc-600 mt-1">{strategy.createdAt}</p>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* 푸터 */}
            <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-zinc-500">
                {selectedNewStrategy ? <><span className="text-zinc-300">{selectedNewStrategy.name || `전략 #${selectedNewStrategy.id}`}</span>으로 변경됩니다</> : '변경할 전략을 선택해 주세요'}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setStrategyChangePopup(null); setSelectedNewStrategy(null); }}
                  className="px-4 py-2 text-sm font-medium bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={handleStrategyChange}
                  disabled={!selectedNewStrategy}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    selectedNewStrategy
                      ? 'bg-teal-500 hover:bg-teal-400 text-white cursor-pointer'
                      : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  변경하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 자본금 조정 팝업 */}
      {capitalPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60" onClick={() => { setCapitalPopup(null); setCapitalAmount(''); }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div>
              <h2 className="text-base font-bold text-zinc-100">자본금 조정</h2>
              <p className="text-xs text-zinc-500 mt-1">입금은 양수, 출금은 음수로 입력하세요. 보유 포지션과 지금까지의 수익 이력은 그대로 유지되고, 수익률 계산 기준점만 조정됩니다.</p>
            </div>
            <input
              type="text"
              value={capitalAmount}
              onChange={e => setCapitalAmount(e.target.value)}
              placeholder="예: 5000000 (입금) / -2000000 (출금)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-teal-500 transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setCapitalPopup(null); setCapitalAmount(''); }}
                className="flex-1 py-2.5 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleAdjustCapital}
                disabled={!capitalAmount.trim() || capitalSubmitting}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer text-white ${
                  !capitalAmount.trim() || capitalSubmitting ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400'
                }`}
              >
                {capitalSubmitting ? <><i className="ri-loader-4-line animate-spin mr-1"></i>처리 중...</> : '조정하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 중지/재실행 확인 팝업 */}
      {confirmAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                confirmAction.type === 'stop' ? 'bg-amber-500/20' : confirmAction.type === 'resume' ? 'bg-teal-500/20' : confirmAction.type === 'reset' ? 'bg-blue-500/20' : 'bg-red-500/20'
              }`}>
                <i className={`text-lg ${
                  confirmAction.type === 'stop' ? 'ri-stop-line text-amber-400' : confirmAction.type === 'resume' ? 'ri-play-line text-teal-400' : confirmAction.type === 'reset' ? 'ri-refresh-line text-blue-400' : 'ri-delete-bin-line text-red-400'
                }`}></i>
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-100">
                  세션 {confirmAction.type === 'stop' ? '중지' : confirmAction.type === 'resume' ? '재실행' : confirmAction.type === 'reset' ? '초기화' : '삭제'}
                </p>
                <p className="text-sm text-zinc-400 mt-0.5">
                  {confirmAction.type === 'stop'
                    ? '해당 세션을 중지하시겠습니까?'
                    : confirmAction.type === 'resume'
                    ? '해당 세션을 재실행하시겠습니까?'
                    : confirmAction.type === 'reset'
                    ? '해당 세션을 초기화하시겠습니까?'
                    : '해당 세션을 삭제하시겠습니까?'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  const { id, type } = confirmAction;
                  setConfirmAction(null);
                  if (type === 'stop') await handleStopSession(id);
                  else if (type === 'resume') await handleResumeSession(id);
                  else if (type === 'reset') await handleResetSession(id);
                  else await handleDeleteSession(id);
                }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer text-white ${
                  confirmAction.type === 'stop' ? 'bg-amber-500 hover:bg-amber-400'
                  : confirmAction.type === 'resume' ? 'bg-teal-500 hover:bg-teal-400'
                  : confirmAction.type === 'reset' ? 'bg-blue-500 hover:bg-blue-400'
                  : 'bg-red-500 hover:bg-red-400'
                }`}
              >
                {confirmAction.type === 'stop' ? '중지' : confirmAction.type === 'resume' ? '재실행' : confirmAction.type === 'reset' ? '초기화' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 거래 리스트 팝업 */}
      {tradePopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60" onClick={() => { setTradePopup(null); setTradePopupDetail(null); }}>
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-6xl shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-zinc-100">거래 내역</h2>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${tradePopup.mode === 'LIVE' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'}`}>
                    {tradePopup.mode === 'LIVE' ? '실전' : '모의'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{tradePopup.symbolName} · {tradePopup.symbol}</p>
              </div>
              <button
                onClick={() => { setTradePopup(null); setTradePopupDetail(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-zinc-400 text-lg"></i>
              </button>
            </div>

            {/* 거래 상세 팝업 (내부) */}
            {tradePopupDetail && (() => {
              const t = tradePopupDetail;
              const isClose = t.action === 'CLOSE_LONG' || t.action === 'CLOSE_SHORT';
              const pnlColor = t.realizedPnl != null && t.realizedPnl >= 0 ? 'text-sky-400' : 'text-rose-400';
              const ACTION_STYLE: Record<string, string> = { BUY: 'bg-teal-500/20 text-teal-300', ADD_LONG: 'bg-blue-500/20 text-blue-300', SELL_SHORT: 'bg-rose-500/20 text-rose-300', CLOSE_LONG: 'bg-sky-500/20 text-sky-300', CLOSE_SHORT: 'bg-orange-500/20 text-orange-300' };
              const ACTION_LABEL: Record<string, string> = { BUY: '매수 (BUY)', ADD_LONG: '추가매수 (ADD_LONG)', SELL_SHORT: '공매도 (SELL_SHORT)', CLOSE_LONG: '청산 롱 (CLOSE_LONG)', CLOSE_SHORT: '청산 숏 (CLOSE_SHORT)' };
              const MODE_STYLE: Record<string, string> = { LIVE: 'bg-amber-500/20 text-amber-300', PAPER: 'bg-blue-500/20 text-blue-300' };
              const STATUS_STYLE: Record<string, string> = { SUCCESS: 'bg-emerald-500/20 text-emerald-300', FAILED: 'bg-rose-500/20 text-rose-400' };
              return (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 rounded-2xl" onClick={() => setTradePopupDetail(null)}>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl mx-4 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900">
                      <div>
                        <h3 className="text-base font-bold text-zinc-100">거래 상세</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">{t.symbolName ?? t.symbol} · {t.symbol}</p>
                      </div>
                      <button onClick={() => setTradePopupDetail(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">
                        <i className="ri-close-line text-zinc-400 text-lg"></i>
                      </button>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                      <div className="bg-zinc-800/50 rounded-xl px-5 py-4 grid grid-cols-3 gap-4">
                        <div><p className="text-xs text-zinc-500 mb-1">모드</p><span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${MODE_STYLE[t.mode]}`}>{t.mode === 'LIVE' ? '실전' : '모의'}</span></div>
                        <div><p className="text-xs text-zinc-500 mb-1">액션</p><span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${ACTION_STYLE[t.action]}`}>{ACTION_LABEL[t.action] ?? t.action}</span></div>
                        <div><p className="text-xs text-zinc-500 mb-1">주문 상태</p><span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLE[t.orderStatus]}`}>{t.orderStatus === 'SUCCESS' ? '성공' : '실패'}</span></div>
                      </div>
                      <div className="bg-zinc-800/50 rounded-xl px-5 py-4 grid grid-cols-3 gap-4">
                        <div><p className="text-xs text-zinc-500 mb-1">수량</p><p className="text-sm font-bold text-zinc-100">{t.shares.toLocaleString()}주</p></div>
                        {isClose ? (<>
                          <div><p className="text-xs text-zinc-500 mb-1">청산가</p><p className="text-sm font-bold text-zinc-100">{t.exitPrice != null ? `₩${t.exitPrice.toLocaleString()}` : '—'}</p></div>
                          <div><p className="text-xs text-zinc-500 mb-1">총매도금액</p><p className="text-sm font-bold text-sky-300">{t.exitPrice != null ? `₩${(t.exitPrice * t.shares).toLocaleString()}` : '—'}</p></div>
                        </>) : (<>
                          <div><p className="text-xs text-zinc-500 mb-1">진입가</p><p className="text-sm font-bold text-zinc-100">{t.entryPrice != null ? `₩${t.entryPrice.toLocaleString()}` : '—'}</p></div>
                          <div><p className="text-xs text-zinc-500 mb-1">총매수금액</p><p className="text-sm font-bold text-teal-300">{t.entryPrice != null ? `₩${(t.entryPrice * t.shares).toLocaleString()}` : '—'}</p></div>
                        </>)}
                      </div>
                      {isClose && (
                        <div className="bg-zinc-800/50 rounded-xl px-5 py-4 grid grid-cols-3 gap-4">
                          <div><p className="text-xs text-zinc-500 mb-1">실현 손익</p><p className={`text-sm font-bold ${pnlColor}`}>{t.realizedPnl != null ? `${t.realizedPnl >= 0 ? '+' : ''}₩${t.realizedPnl.toLocaleString()}` : '—'}</p></div>
                          <div><p className="text-xs text-zinc-500 mb-1">보유 봉 수</p><p className="text-sm font-bold text-zinc-100">{t.barsHeld != null ? `${t.barsHeld}봉` : '—'}</p></div>
                          <div><p className="text-xs text-zinc-500 mb-1">청산 시각</p>{t.exitAt ? <><p className="text-xs font-mono text-zinc-200">{t.exitAt.slice(0, 10)}</p><p className="text-xs font-mono text-zinc-400 mt-0.5">{t.exitAt.slice(11, 19)}</p></> : <p className="text-xs font-mono text-zinc-600">—</p>}</div>
                        </div>
                      )}
                      <div className="bg-zinc-800/50 rounded-xl px-5 py-4 grid grid-cols-2 gap-4">
                        <div><p className="text-xs text-zinc-500 mb-1">진입 시각</p>{t.entryAt ? <><p className="text-xs font-mono text-zinc-200">{t.entryAt.slice(0, 10)}</p><p className="text-xs font-mono text-zinc-400 mt-0.5">{t.entryAt.slice(11, 19)}</p></> : <p className="text-xs font-mono text-zinc-600">—</p>}</div>
                        <div><p className="text-xs text-zinc-500 mb-1">생성 일시</p>{t.createdAt ? <><p className="text-xs font-mono text-zinc-200">{t.createdAt.slice(0, 10)}</p><p className="text-xs font-mono text-zinc-400 mt-0.5">{t.createdAt.slice(11, 19)}</p></> : <p className="text-xs font-mono text-zinc-600">—</p>}</div>
                      </div>
                      <div className="bg-zinc-800/50 rounded-xl px-5 py-4 grid grid-cols-2 gap-4">
                        <div><p className="text-xs text-zinc-500 mb-1">손절가 (Stop)</p><p className="text-sm text-zinc-200">{t.stopPrice != null ? `₩${t.stopPrice.toLocaleString()}` : '—'}</p></div>
                        <div><p className="text-xs text-zinc-500 mb-1">익절가 (TP)</p><p className="text-sm text-zinc-200">{t.tpPrice != null ? `₩${t.tpPrice.toLocaleString()}` : '—'}</p></div>
                      </div>
                      <div className="bg-zinc-800/50 rounded-xl px-5 py-4 grid grid-cols-2 gap-4">
                        <div><p className="text-xs text-zinc-500 mb-1">수익률</p><p className="text-sm text-zinc-200">{t.currentEquity != null ? `${((t.currentEquity - 1) * 100).toFixed(2)}%` : '—'}</p></div>
                        <div><p className="text-xs text-zinc-500 mb-1">최대 수익률 (Peak)</p><p className="text-sm text-zinc-200">{t.peakEquity != null ? `${((t.peakEquity - 1) * 100).toFixed(2)}%` : '—'}</p></div>
                      </div>
                      {t.orderStatus === 'FAILED' && t.errorMessage && (
                        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-5 py-4">
                          <p className="text-xs text-rose-400 mb-1">오류 메시지</p>
                          <p className="text-sm text-rose-300 break-words">{t.errorMessage}</p>
                        </div>
                      )}
                    </div>
                    <div className="px-6 py-4 border-t border-zinc-800 flex justify-end sticky bottom-0 bg-zinc-900">
                      <button onClick={() => setTradePopupDetail(null)} className="px-5 py-2 text-sm font-medium bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors cursor-pointer">닫기</button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 날짜 필터 + 요약 */}
            {!tradePopupLoading && (
              <div className="px-6 py-3 border-b border-zinc-800 shrink-0 space-y-3">
                {/* 날짜 범위 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-zinc-500">기간</span>
                  <input
                    type="date"
                    value={tradePopupDateFrom}
                    onChange={e => setTradePopupDateFrom(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:border-teal-500 [color-scheme:dark]"
                  />
                  <span className="text-zinc-600 text-xs">~</span>
                  <input
                    type="date"
                    value={tradePopupDateTo}
                    onChange={e => setTradePopupDateTo(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:border-teal-500 [color-scheme:dark]"
                  />
                  {(tradePopupDateFrom || tradePopupDateTo) && (
                    <button
                      onClick={() => { setTradePopupDateFrom(''); setTradePopupDateTo(''); }}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      초기화
                    </button>
                  )}
                </div>
                {/* 요약 */}
                {(() => {
                  const filtered = tradePopupList.filter(t => {
                    const d = (t.createdAt ?? '').slice(0, 10);
                    return (!tradePopupDateFrom || d >= tradePopupDateFrom) && (!tradePopupDateTo || d <= tradePopupDateTo);
                  });
                  const closeItems = filtered.filter(t => t.action === 'SELL' || t.action === 'CLOSE_LONG' || t.action === 'CLOSE_SHORT');
                  const buyItems   = filtered.filter(t => t.action === 'BUY' || t.action === 'ADD_LONG');
                  const totalPnl   = closeItems.reduce((s, t) => s + (t.realizedPnl ?? 0), 0);
                  const pnlColor   = totalPnl >= 0 ? 'text-sky-400' : 'text-rose-400';
                  return (
                    <div className="flex flex-wrap gap-2">
                      <div className="bg-zinc-800/60 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                        <span className="text-xs text-zinc-500">전체</span>
                        <span className="text-xs font-bold text-zinc-200">{filtered.length}건</span>
                      </div>
                      <div className="bg-zinc-800/60 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                        <span className="text-xs text-zinc-500">매수</span>
                        <span className="text-xs font-bold text-teal-400">{buyItems.length}건</span>
                      </div>
                      <div className="bg-zinc-800/60 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                        <span className="text-xs text-zinc-500">청산</span>
                        <span className="text-xs font-bold text-sky-400">{closeItems.length}건</span>
                      </div>
                      <div className="bg-zinc-800/60 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                        <span className="text-xs text-zinc-500">총 실현 손익</span>
                        <span className={`text-xs font-bold ${pnlColor}`}>
                          {totalPnl >= 0 ? '+' : ''}₩{totalPnl.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 리스트 */}
            <div className="overflow-auto flex-1">
              {tradePopupLoading ? (
                <div className="flex items-center justify-center py-16">
                  <i className="ri-loader-4-line animate-spin text-teal-400 text-3xl"></i>
                </div>
              ) : (() => {
                const ACTION_STYLE: Record<string, string> = { BUY: 'bg-teal-500/20 text-teal-300', ADD_LONG: 'bg-blue-500/20 text-blue-300', SELL_SHORT: 'bg-rose-500/20 text-rose-300', CLOSE_LONG: 'bg-sky-500/20 text-sky-300', CLOSE_SHORT: 'bg-orange-500/20 text-orange-300' };
                const ACTION_LABEL: Record<string, string> = { BUY: '매수', ADD_LONG: '추가매수', SELL_SHORT: '공매도', CLOSE_LONG: '청산(롱)', CLOSE_SHORT: '청산(숏)' };
                const MODE_STYLE: Record<string, string> = { LIVE: 'bg-amber-500/20 text-amber-300', PAPER: 'bg-blue-500/20 text-blue-300' };
                const STATUS_STYLE: Record<string, string> = { SUCCESS: 'bg-emerald-500/20 text-emerald-300', FAILED: 'bg-rose-500/20 text-rose-400' };
                // 번호/종목코드/종목명/모드/액션/수량/진입가/진입시각/청산가/청산시각/실현손익/상태/생성일시 (사용자명 제외)
                const COL = 'grid-cols-[36px_80px_110px_68px_90px_70px_95px_115px_95px_115px_105px_70px_115px]';
                const displayList = tradePopupList.filter(t => {
                  const d = (t.createdAt ?? '').slice(0, 10);
                  return (!tradePopupDateFrom || d >= tradePopupDateFrom) && (!tradePopupDateTo || d <= tradePopupDateTo);
                });
                return displayList.length === 0 ? (
                  <div className="py-16 text-center text-zinc-600 text-sm min-w-[1100px]">
                    <i className="ri-inbox-line text-3xl mb-2 block"></i>
                    거래 내역이 없습니다
                  </div>
                ) : (
                  <div className="min-w-[1100px]">
                    {/* 테이블 헤더 */}
                    <div className={`grid ${COL} text-xs font-semibold text-zinc-500 uppercase tracking-wide px-3 py-3 border-b border-zinc-800 bg-zinc-800/40`}>
                      <span className="text-center">#</span>
                      <span>종목코드</span>
                      <span>종목명</span>
                      <span className="text-center">모드</span>
                      <span className="text-center">액션</span>
                      <span className="text-right">수량</span>
                      <span className="text-right">진입가</span>
                      <span className="text-center">진입시각</span>
                      <span className="text-right">청산가</span>
                      <span className="text-center">청산시각</span>
                      <span className="text-right">실현손익</span>
                      <span className="text-center">상태</span>
                      <span className="text-center">생성일시</span>
                    </div>
                    {displayList.map((item, idx) => {
                      const isClose = item.action === 'CLOSE_LONG' || item.action === 'CLOSE_SHORT';
                      const pnlColor = item.realizedPnl != null && item.realizedPnl >= 0 ? 'text-sky-400' : 'text-rose-400';
                      return (
                        <div
                          key={item.id}
                          onClick={() => setTradePopupDetail(item)}
                          className={`grid ${COL} items-center px-3 py-3 cursor-pointer hover:bg-zinc-800/60 transition-colors ${idx !== displayList.length - 1 ? 'border-b border-zinc-800/70' : ''}`}
                        >
                          <span className="text-center text-xs text-zinc-600">{idx + 1}</span>
                          <span className="text-xs text-zinc-400 font-mono truncate pr-2">{item.symbol}</span>
                          <span className="text-sm font-medium text-zinc-100 truncate pr-2 hover:text-teal-400 transition-colors">{item.symbolName ?? item.symbol}</span>
                          <div className="flex justify-center">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${MODE_STYLE[item.mode]}`}>{item.mode === 'LIVE' ? '실전' : '모의'}</span>
                          </div>
                          <div className="flex justify-center">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full whitespace-nowrap ${ACTION_STYLE[item.action] ?? 'bg-zinc-700 text-zinc-400'}`}>{ACTION_LABEL[item.action] ?? item.action}</span>
                          </div>
                          <span className="text-right text-xs font-semibold text-zinc-200">{item.shares.toLocaleString()}주</span>
                          <span className="text-right text-xs text-zinc-300">{item.entryPrice != null ? `₩${item.entryPrice.toLocaleString()}` : <span className="text-zinc-600">—</span>}</span>
                          <div className="text-center">{item.entryAt ? <><p className="text-xs text-zinc-300">{item.entryAt.slice(0, 10)}</p><p className="text-xs text-zinc-500 mt-0.5">{item.entryAt.slice(11, 19)}</p></> : <span className="text-zinc-600">—</span>}</div>
                          <span className="text-right text-xs text-zinc-300">{item.exitPrice != null ? `₩${item.exitPrice.toLocaleString()}` : <span className="text-zinc-600">—</span>}</span>
                          <div className="text-center">{item.exitAt ? <><p className="text-xs text-zinc-300">{item.exitAt.slice(0, 10)}</p><p className="text-xs text-zinc-500 mt-0.5">{item.exitAt.slice(11, 19)}</p></> : <span className="text-zinc-600">—</span>}</div>
                          <span className={`text-right text-xs font-semibold ${isClose && item.realizedPnl != null ? pnlColor : 'text-zinc-600'}`}>
                            {isClose && item.realizedPnl != null ? `${item.realizedPnl >= 0 ? '+' : ''}₩${item.realizedPnl.toLocaleString()}` : '—'}
                          </span>
                          <div className="flex justify-center">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLE[item.orderStatus]}`}>{item.orderStatus === 'SUCCESS' ? '성공' : '실패'}</span>
                          </div>
                          <div className="text-center">{item.createdAt ? <><p className="text-xs text-zinc-300">{item.createdAt.slice(0, 10)}</p><p className="text-xs text-zinc-500 mt-0.5">{item.createdAt.slice(11, 19)}</p></> : <span className="text-zinc-600">—</span>}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* 푸터 */}
            <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between shrink-0">
              <span className="text-xs text-zinc-500">
                총 {(() => {
                  const d = (tradePopupDateFrom || tradePopupDateTo)
                    ? tradePopupList.filter(t => {
                        const dt = (t.createdAt ?? '').slice(0, 10);
                        return (!tradePopupDateFrom || dt >= tradePopupDateFrom) && (!tradePopupDateTo || dt <= tradePopupDateTo);
                      }).length
                    : tradePopupList.length;
                  return d;
                })()}건
              </span>
              <button
                onClick={() => { setTradePopup(null); setTradePopupDetail(null); }}
                className="px-5 py-2 text-sm font-medium bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 오류 팝업 */}
      {errorMessage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/50"
          onKeyDown={e => { if (e.key === 'Enter') setErrorMessage(''); }}
          tabIndex={-1}
          ref={el => el?.focus()}
        >
          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <i className="ri-error-warning-line text-red-400 text-2xl"></i>
            </div>
            <p className="text-sm text-zinc-200">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage('')}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-100">실전투자</h1>

        {/* 세션 생성 카드 — 일반 사용자만 표시 */}
        {!isAdmin && <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-zinc-200 mb-4">세션 생성</h2>

          <div className="space-y-4 mb-6">
            {/* 종목 선택 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-zinc-400">종목</label>
                <div className="flex bg-zinc-800 rounded-md p-0.5 gap-0.5">
                  <button
                    type="button"
                    onClick={() => { setInvestSymbolMode('dropdown'); setInvestDropdown(''); setInvestSymbol(''); }}
                    className={`px-3 py-1 text-xs rounded transition-colors cursor-pointer ${
                      investSymbolMode === 'dropdown' ? 'bg-teal-500 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    선택
                  </button>
                  <button
                    type="button"
                    onClick={() => { setInvestSymbolMode('direct'); setInvestSymbol(''); }}
                    className={`px-3 py-1 text-xs rounded transition-colors cursor-pointer ${
                      investSymbolMode === 'direct' ? 'bg-teal-500 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    직접입력
                  </button>
                </div>
              </div>
              {investSymbolMode === 'dropdown' ? (
                <select
                  value={investDropdown}
                  onChange={e => { setInvestDropdown(e.target.value); setInvestSymbol(e.target.value); }}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-teal-500 transition-colors"
                >
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
                <input
                  type="text"
                  value={investSymbol}
                  onChange={e => setInvestSymbol(e.target.value)}
                  placeholder="예: 005930"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-teal-500 transition-colors"
                />
              )}
              <p className="text-xs text-zinc-600 mt-1.5">투자금은 KIS 실계좌/모의계좌 잔고를 기준으로 자동 반영됩니다.</p>
            </div>
          </div>

          {/* 투자 모드 선택 */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm font-medium text-zinc-400">거래 모드</span>
            <div className="flex bg-zinc-800 rounded-lg p-1 gap-1">
              <button
                type="button"
                onClick={() => setInvestMode('LIVE')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
                  investMode === 'LIVE' ? 'bg-amber-500 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <i className="ri-live-line mr-1.5"></i>실전투자
              </button>
              <button
                type="button"
                onClick={() => setInvestMode('PAPER')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
                  investMode === 'PAPER' ? 'bg-amber-500 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <i className="ri-test-tube-line mr-1.5"></i>모의투자
              </button>
            </div>
          </div>

          <button
            onClick={handleCreateSession}
            disabled={!investSymbol.trim() || !investMode || investing}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold transition-colors ${
              !investSymbol.trim() || !investMode || investing
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-teal-500 hover:bg-teal-400 text-white cursor-pointer'
            }`}
          >
            {investing
              ? <><i className="ri-loader-4-line animate-spin text-lg"></i>처리 중...</>
              : <><i className="ri-add-line text-lg"></i>세션 생성하기</>
            }
          </button>
          <p className="text-xs text-zinc-600 mt-3">전략은 시장 상황에 따라 자동으로 적용됩니다.</p>
        </div>}

        {/* 진행 섹션 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-zinc-200">진행 섹션</h2>
              <div className="flex bg-zinc-800 rounded-lg p-1 gap-1">
                {(['LIVE', 'PAPER'] as const).map(tab => {
                  const count = sessionList.filter(s => s.mode === tab).length;
                  return (
                    <button
                      key={tab}
                      onClick={() => setSessionTab(tab)}
                      className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors cursor-pointer ${
                        sessionTab === tab ? 'bg-amber-500 text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {tab === 'LIVE' ? '실전투자' : '모의투자'}
                      <span className={`ml-1.5 text-xs ${sessionTab === tab ? 'text-amber-100' : 'text-zinc-600'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">ON/OFF</span>
                  <button
                    type="button"
                    onClick={handleAdminToggle}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${adminToggle ? 'bg-teal-500' : 'bg-zinc-600'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${adminToggle ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              )}
              <button
                onClick={() => fetchSessionList()}
                className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                title="새로고침"
              >
                <i className={`ri-refresh-line ${statusLoading ? 'animate-spin' : ''}`}></i>
              </button>
            </div>
          </div>

          {statusLoading && sessionList.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <i className="ri-loader-4-line animate-spin text-teal-400 text-3xl"></i>
            </div>
          ) : visibleSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-600">
              <i className="ri-inbox-line text-4xl mb-2"></i>
              <p className="text-sm">진행 중인 세션이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleSessions.map(session => {
                const hasShares = (session.sharesHeld ?? 0) >= 1;
                const valueColor = 'text-white';
                return (
                <div key={session.id} className={`bg-zinc-800/60 border rounded-xl p-4 space-y-3 ${
                  hasShares
                    ? 'border-purple-500 shadow-[0_0_0_1px_rgba(168,85,247,0.2)]'
                    : 'border-zinc-700/50'
                }`}>
                  {/* 헤더 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isAdmin && session.userDTO?.userName && (
                        <span className="text-xs text-zinc-300 bg-zinc-700 px-2 py-0.5 rounded-md">
                          {session.userDTO.userName}
                        </span>
                      )}
                      <span className="text-sm font-semibold text-zinc-200">
                        {getSymbolName(session.symbol)}
                        <span className="ml-1 text-xs text-zinc-500">({session.symbol})</span>
                      </span>
                      {session.strategyConfig ? (
                        <span
                          className="text-xs text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-md cursor-pointer hover:bg-teal-500/20 transition-colors"
                          title={`익절 +${session.strategyConfig.takeProfitPct}% · 손절 -${session.strategyConfig.stopLossPct}% (클릭해서 변경)`}
                          onClick={() => openStrategyChangePopup(session.id, session.strategyConfigId, session.strategyConfig!.name || `전략 #${session.strategyConfigId}`)}
                        >
                          {session.strategyConfig.name || `전략 #${session.strategyConfigId}`}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-md">전략 미지정</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-300">{session.lastUpdatedAt}</span>
                      {!isAdmin && (
                        <div className="relative group flex items-center gap-1.5 bg-zinc-700/50 border border-zinc-600/50 rounded-lg px-2.5 py-1">
                          <span className="text-xs text-zinc-400">강제청산</span>
                          <button
                            type="button"
                            onClick={() => handleToggleForceClose(session)}
                            className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${(forceCloseMap[session.id] ?? (session.isForceCloseEnabled !== 0)) ? 'bg-teal-500' : 'bg-zinc-600'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${(forceCloseMap[session.id] ?? (session.isForceCloseEnabled !== 0)) ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10 pointer-events-none">
                            <div className="bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-xs text-zinc-300 whitespace-nowrap shadow-lg space-y-1">
                              <p>ON: 15:18 장마감 전 자동 강제청산</p>
                              <p>OFF: 강제청산 없이 포지션 유지</p>
                            </div>
                            <div className="absolute right-3 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-zinc-600" />
                          </div>
                        </div>
                      )}
                      {!isAdmin && (
                        <button
                          onClick={() => handleSyncPosition(session.id)}
                          disabled={syncingId === session.id}
                          className="px-2.5 py-1 text-xs font-semibold bg-purple-500/15 text-purple-400 hover:bg-purple-500/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title="KIS 실잔고 기준으로 보유 수량/평균단가를 동기화합니다"
                        >
                          <i className={`ri-loop-right-line mr-1 ${syncingId === session.id ? 'animate-spin' : ''}`}></i>동기화
                        </button>
                      )}
                      {!isAdmin && (
                        <button
                          onClick={() => { setCapitalPopup({ sessionId: session.id }); setCapitalAmount(''); }}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                          title="입금/출금 시 수익률 기준점을 조정합니다 (포지션·수익 이력은 유지)"
                        >
                          <i className="ri-exchange-dollar-line mr-1"></i>자본금 조정
                        </button>
                      )}
                      {!isAdmin && (
                        <button
                          onClick={() => setConfirmAction({ id: session.id, type: 'reset' })}
                          className="px-2.5 py-1 text-xs font-semibold bg-blue-500/15 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors cursor-pointer"
                        >
                          <i className="ri-refresh-line mr-1"></i>초기화
                        </button>
                      )}
                      {!isAdmin && session.active === 1 && (
                        <button
                          onClick={() => setConfirmAction({ id: session.id, type: 'stop' })}
                          className="px-2.5 py-1 text-xs font-semibold bg-amber-500/15 text-amber-400 hover:bg-amber-500/30 rounded-lg transition-colors cursor-pointer"
                        >
                          <i className="ri-stop-line mr-1"></i>중지
                        </button>
                      )}
                      {!isAdmin && session.active !== 1 && (
                        <button
                          onClick={() => setConfirmAction({ id: session.id, type: 'resume' })}
                          className="px-2.5 py-1 text-xs font-semibold bg-teal-500/15 text-teal-400 hover:bg-teal-500/30 rounded-lg transition-colors cursor-pointer"
                          title="실행하면 15분마다 시장 상황에 맞는 전략이 자동 적용됩니다"
                        >
                          <i className="ri-play-line mr-1"></i>시작
                        </button>
                      )}
                      {!isAdmin && (
                        <button
                          onClick={() => setConfirmAction({ id: session.id, type: 'delete' })}
                          className="px-2.5 py-1 text-xs font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors cursor-pointer"
                        >
                          <i className="ri-delete-bin-line mr-1"></i>삭제
                        </button>
                      )}
                    </div>
                  </div>
                  {/* 세션 데이터 */}
                  <div
                    className="grid grid-cols-4 gap-2 cursor-pointer group/data"
                    title="클릭하면 거래 내역을 확인합니다"
                    onClick={() => setTradePopup({
                      symbol: session.symbol,
                      symbolName: session.symbolName ?? getSymbolName(session.symbol),
                      userUid: session.userUid,
                      mode: session.mode,
                    })}
                  >
                    <div className="bg-zinc-800 group-hover/data:bg-zinc-700/70 rounded-lg px-3 py-2 transition-colors">
                      <p className="text-xs text-zinc-400 mb-1.5">현재 포지션</p>
                      {positionBadge(session.currentPosition)}
                    </div>
                    <div className="bg-zinc-800 group-hover/data:bg-zinc-700/70 rounded-lg px-3 py-2 transition-colors">
                      <p className="text-xs text-zinc-400 mb-1">보유 수량</p>
                      <p className={`text-sm font-semibold ${valueColor}`}>{session.sharesHeld ?? '-'}</p>
                    </div>
                    <div className="bg-zinc-800 group-hover/data:bg-zinc-700/70 rounded-lg px-3 py-2 transition-colors">
                      <p className="text-xs text-zinc-400 mb-1">평균 진입가</p>
                      <p className={`text-sm font-semibold ${valueColor}`}>
                        {session.avgEntryPrice != null ? session.avgEntryPrice.toLocaleString() : '-'}
                      </p>
                    </div>
                    <div className="bg-zinc-800 group-hover/data:bg-zinc-700/70 rounded-lg px-3 py-2 transition-colors">
                      <p className="text-xs text-zinc-400 mb-1">수익률</p>
                      <p className={`text-sm font-semibold ${valueColor}`}>
                        {session.currentEquity != null ? `${((session.currentEquity - 1) * 100).toFixed(2)}%` : '-'}
                      </p>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
