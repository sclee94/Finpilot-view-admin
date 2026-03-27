import { useState, useEffect, useCallback } from 'react';
import PageLayout from '../../components/PageLayout';
import { apiClient } from '../../api/apiClient';
import { authStorage } from '../../utils/auth';
import type { ApiResponse } from '../../types/index';
import type { StrategyConfigDTO, BoardItem } from '../strategy/strategyTypes';
import { dtoToBoardItem } from '../strategy/strategyTypes';
import { getSymbolName } from '../../constants/symbolNames';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveStatus {
  id:               string;
  strategyConfigId: number;
  mode:             'LIVE' | 'PAPER';
  symbol:           string;
  active:           number;
  strategyConfig:   { id: number; title: string } | null;
  currentPosition:  'NONE' | 'LONG' | 'SHORT';
  barsHeld:         number;
  stopPrice:        number | null;
  tpPrice:          number | null;
  cooldownBarsLeft: number;
  consecSlCount:    number;
  currentEquity:    number;
  peakEquity:       number;
  createdAt:        string;
  lastUpdatedAt:    string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PARAM_LABELS: { key: keyof BoardItem['params']; label: string; format?: (v: unknown) => string }[] = [
  { key: 'symbol',                label: '종목 코드' },
  { key: 'initial_capital',       label: '초기 자본',       format: v => Number(v).toLocaleString() + ' 원' },
  { key: 'risk_per_trade',        label: '위험 비율',        format: v => (Number(v) * 100).toFixed(1) + '%' },
  { key: 'adx_threshold',         label: 'ADX 임계값' },
  { key: 'adx_persist',           label: 'ADX 지속 기간' },
  { key: 'rsi_long_entry',        label: 'RSI 롱 진입' },
  { key: 'rsi_short_entry',       label: 'RSI 숏 진입' },
  { key: 'atr_sl_mult',           label: 'ATR 손절 배수' },
  { key: 'atr_tp_mult',           label: 'ATR 익절 배수' },
  { key: 'min_hold_bars',         label: '최소 보유 봉' },
  { key: 'sl_cooldown_bars',      label: '손절 쿨다운' },
  { key: 'consec_sl_limit',       label: '연속 손절 한도' },
  { key: 'max_dd_stop',           label: '최대 낙폭 정지',   format: v => Number(v) === 0 ? '비활성' : String(v) },
  { key: 'commission',            label: '수수료',           format: v => (Number(v) * 100).toFixed(3) + '%' },
  { key: 'slippage',              label: '슬리피지',         format: v => (Number(v) * 100).toFixed(3) + '%' },
  { key: 'use_prev_bar_signal',   label: '이전 봉 신호',     format: v => v ? 'ON' : 'OFF' },
  { key: 'indicator_window',      label: '지표 룩백 기간' },
  { key: 'trading_days_per_year', label: '연간 거래일 수' },
];

const LIVE_PARAM_LABELS: { key: keyof BoardItem['params']; label: string; format?: (v: unknown) => string }[] = [
  { key: 'cooldown_bars_left', label: '쿨다운 잔여 봉' },
  { key: 'consec_sl_count',   label: '연속 손절 횟수' },
  { key: 'current_equity',    label: '현재 자산',   format: v => Number(v).toFixed(6) },
  { key: 'peak_equity',       label: '최고 자산',   format: v => Number(v).toFixed(6) },
];

function positionBadge(pos: LiveStatus['currentPosition']) {
  if (pos === 'LONG')  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300">LONG</span>;
  if (pos === 'SHORT') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-300">SHORT</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-700 text-zinc-400">NONE</span>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Live() {
  const [appliedItem, setAppliedItem] = useState<BoardItem | null>(null);
  const [investing, setInvesting]       = useState(false);
  const [sessionList, setSessionList]   = useState<LiveStatus[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [errorMessage, setErrorMessage]   = useState('');

  // 투자 모드 (기본값 없음)
  const [investMode, setInvestMode] = useState<'LIVE' | 'PAPER' | null>(null);

  // 진행 섹션 탭
  const [sessionTab, setSessionTab] = useState<'LIVE' | 'PAPER'>('LIVE');

  // 중지/재실행/삭제 확인 팝업
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: 'stop' | 'resume' | 'delete' } | null>(null);

  // 실전투자 전용 입력값 (기본값 0)
  const [liveParams, setLiveParams] = useState({
    cooldownBarsLeft: 0,
    consecSlCount:    0,
    currentEquity:    0,
    peakEquity:       0,
  });

  // Applied strategy — API 조회
  const fetchApplied = useCallback(async () => {
    const userUid = authStorage.get()?.userUid;
    if (!userUid) return;
    try {
      const res = await apiClient.post<ApiResponse<StrategyConfigDTO[]>>(
        '/strategy/getStrategyConfigList',
        { userUid },
      );
      const applied = (res.data ?? []).find(d => d.isUse === 1) ?? null;
      setAppliedItem(applied ? dtoToBoardItem(applied) : null);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchApplied();
    const handleCustom = () => fetchApplied();
    window.addEventListener('strategyAppliedChanged', handleCustom);
    return () => window.removeEventListener('strategyAppliedChanged', handleCustom);
  }, [fetchApplied]);

  // 진행 세션 목록 조회
  const fetchSessionList = useCallback(async () => {
    const userUid = authStorage.get()?.userUid;
    if (!userUid) return;
    setStatusLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<LiveStatus[]>>(
        '/trade/getTradingSessionList',
        { userUid },
      );
      setSessionList(res.data ?? []);
    } catch { /* silent */ } finally {
      setStatusLoading(false);
    }
  }, []);

  // 투자하기
  const handleInvest = async () => {
    if (!appliedItem || investing || !investMode) return;
    const userUid = authStorage.get()?.userUid;
    if (!userUid) return;

    setInvesting(true);
    setErrorMessage('');
    try {
      const res = await apiClient.post<ApiResponse<LiveStatus>>(
        '/trade/insertTradingSession',
        {
          userUid,
          strategyConfigId: appliedItem.id,
          symbol:           appliedItem.params.symbol,
          mode:             investMode,
          cooldownBarsLeft: liveParams.cooldownBarsLeft,
          consecSlCount:    liveParams.consecSlCount,
          currentEquity:    liveParams.currentEquity,
          peakEquity:       liveParams.peakEquity,
        },
      );
      if (res.data) {
        await fetchSessionList();
      } else {
        setErrorMessage(res.message || '투자 시작에 실패했습니다.');
      }
    } catch {
      setErrorMessage('서버 연결에 실패했습니다.');
    } finally {
      setInvesting(false);
    }
  };

  // 마운트 시 진행 세션 목록 조회
  useEffect(() => {
    fetchSessionList();
  }, [fetchSessionList]);

  // 세션 중지 (active: 0)
  const handleStopSession = async (id: string) => {
    try {
      await apiClient.put('/trade/updateTradingSession', { id, active: 0 });
      await fetchSessionList();
    } catch {
      setErrorMessage('세션 중지에 실패했습니다.');
    }
  };

  // 세션 재실행 (active: 1)
  const handleResumeSession = async (id: string) => {
    try {
      await apiClient.put('/trade/updateTradingSession', { id, active: 1 });
      await fetchSessionList();
    } catch {
      setErrorMessage('세션 재실행에 실패했습니다.');
    }
  };

  // 세션 삭제
  const handleDeleteSession = async (id: string) => {
    try {
      await apiClient.delete('/trade/deleteTradingSession', { id });
      await fetchSessionList();
    } catch {
      setErrorMessage('세션 삭제에 실패했습니다.');
    }
  };

  return (
    <PageLayout>
      {/* 중지/재실행 확인 팝업 */}
      {confirmAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                confirmAction.type === 'stop' ? 'bg-amber-500/20' : confirmAction.type === 'resume' ? 'bg-teal-500/20' : 'bg-red-500/20'
              }`}>
                <i className={`text-lg ${
                  confirmAction.type === 'stop' ? 'ri-stop-line text-amber-400' : confirmAction.type === 'resume' ? 'ri-play-line text-teal-400' : 'ri-delete-bin-line text-red-400'
                }`}></i>
              </div>
              <div>
                <p className="text-base font-semibold text-zinc-100">
                  세션 {confirmAction.type === 'stop' ? '중지' : confirmAction.type === 'resume' ? '재실행' : '삭제'}
                </p>
                <p className="text-sm text-zinc-400 mt-0.5">
                  {confirmAction.type === 'stop'
                    ? '해당 세션을 중지하시겠습니까?'
                    : confirmAction.type === 'resume'
                    ? '해당 세션을 재실행하시겠습니까?'
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
                  else await handleDeleteSession(id);
                }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer text-white ${
                  confirmAction.type === 'stop' ? 'bg-amber-500 hover:bg-amber-400'
                  : confirmAction.type === 'resume' ? 'bg-teal-500 hover:bg-teal-400'
                  : 'bg-red-500 hover:bg-red-400'
                }`}
              >
                {confirmAction.type === 'stop' ? '중지' : confirmAction.type === 'resume' ? '재실행' : '삭제'}
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

        {/* 적용된 전략 카드 */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-zinc-200 mb-4">적용된 전략 설정</h2>

          {appliedItem ? (
            <>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="text-xl font-bold text-teal-300">{appliedItem.title}</span>
                <span className="text-sm text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full">{appliedItem.symbol}</span>
                <span className="text-sm text-zinc-500">{appliedItem.date}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                {PARAM_LABELS.map(({ key, label, format }) => {
                  const val = appliedItem.params[key];
                  return (
                    <div key={key} className="bg-zinc-800 rounded-xl px-4 py-3">
                      <p className="text-xs text-zinc-500 mb-1">{label}</p>
                      <p className="text-sm font-semibold text-zinc-200">{format ? format(val) : String(val)}</p>
                    </div>
                  );
                })}
              </div>
              {/* 실전투자 전용 */}
              <div className="border border-amber-500/30 rounded-xl bg-amber-500/5 p-4 mb-6">
                <div className="flex items-center gap-1.5 mb-3">
                  <i className="ri-live-line text-amber-400 text-sm"></i>
                  <span className="text-sm font-semibold text-amber-400">실전투자 전용</span>
                  <span className="text-xs text-amber-500/60 ml-1">백테스트에는 사용되지 않습니다</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([
                    { key: 'cooldownBarsLeft', label: '쿨다운 잔여 봉',  step: 1,    isInt: true },
                    { key: 'consecSlCount',    label: '연속 손절 횟수',  step: 1,    isInt: true },
                    { key: 'currentEquity',    label: '현재 자산',       step: 0.01, isInt: false },
                    { key: 'peakEquity',       label: '최고 자산',       step: 0.01, isInt: false },
                  ] as const).map(({ key, label, step, isInt }) => (
                    <div key={key} className="bg-amber-500/10 rounded-xl px-4 py-3">
                      <p className="text-xs text-amber-500/70 mb-1.5">{label}</p>
                      <input
                        type="number"
                        value={liveParams[key]}
                        step={step}
                        min={0}
                        onChange={e => {
                          const v = e.target.value;
                          setLiveParams(prev => ({
                            ...prev,
                            [key]: isInt ? (parseInt(v) || 0) : (parseFloat(v) || 0),
                          }));
                        }}
                        className="w-full bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-1 text-sm font-semibold text-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
              <i className="ri-settings-3-line text-4xl mb-2"></i>
              <p className="text-base">전략 설정에서 적용할 설정을 선택해 주세요.</p>
            </div>
          )}

          {/* 투자 모드 선택 */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-zinc-400">투자 모드</span>
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
            onClick={handleInvest}
            disabled={!appliedItem || investing || !investMode}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold transition-colors ${
              !appliedItem || investing || !investMode
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-teal-500 hover:bg-teal-400 text-white cursor-pointer'
            }`}
          >
            {investing
              ? <><i className="ri-loader-4-line animate-spin text-lg"></i>처리 중...</>
              : <><i className="ri-live-line text-lg"></i>투자하기</>
            }
          </button>
        </div>

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
            <button
              onClick={fetchSessionList}
              className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              title="새로고침"
            >
              <i className={`ri-refresh-line ${statusLoading ? 'animate-spin' : ''}`}></i>
            </button>
          </div>

          {statusLoading ? (
            <div className="flex items-center justify-center py-10">
              <i className="ri-loader-4-line animate-spin text-teal-400 text-3xl"></i>
            </div>
          ) : sessionList.filter(s => s.mode === sessionTab).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-zinc-600">
              <i className="ri-inbox-line text-4xl mb-2"></i>
              <p className="text-sm">진행 중인 세션이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessionList.filter(s => s.mode === sessionTab).map(session => (
                <div key={session.id} className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4 space-y-3">
                  {/* 헤더 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-200">
                        {getSymbolName(session.symbol)}
                        <span className="ml-1 text-xs text-zinc-500">({session.symbol})</span>
                      </span>
                      <span className="text-xs text-zinc-200 bg-zinc-700 border border-zinc-600 px-2 py-0.5 rounded-md">
                        {session.strategyConfig?.title || '-'}
                      </span>
                      </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-300">{session.lastUpdatedAt}</span>
                      {session.active === 1 ? (
                        <button
                          onClick={() => setConfirmAction({ id: session.id, type: 'stop' })}
                          className="px-2.5 py-1 text-xs font-semibold bg-amber-500/15 text-amber-400 hover:bg-amber-500/30 rounded-lg transition-colors cursor-pointer"
                        >
                          <i className="ri-stop-line mr-1"></i>중지
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmAction({ id: session.id, type: 'resume' })}
                          className="px-2.5 py-1 text-xs font-semibold bg-teal-500/15 text-teal-400 hover:bg-teal-500/30 rounded-lg transition-colors cursor-pointer"
                        >
                          <i className="ri-play-line mr-1"></i>재실행
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmAction({ id: session.id, type: 'delete' })}
                        className="px-2.5 py-1 text-xs font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <i className="ri-delete-bin-line mr-1"></i>삭제
                      </button>
                    </div>
                  </div>
                  {/* 세션 데이터 4×2 */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-zinc-800 rounded-lg px-3 py-2">
                      <p className="text-xs text-zinc-400 mb-1.5">현재 포지션</p>
                      {positionBadge(session.currentPosition)}
                    </div>
                    <div className="bg-zinc-800 rounded-lg px-3 py-2">
                      <p className="text-xs text-zinc-400 mb-1">보유 봉 수</p>
                      <p className="text-sm font-semibold text-white">{session.barsHeld}</p>
                    </div>
                    <div className="bg-zinc-800 rounded-lg px-3 py-2">
                      <p className="text-xs text-zinc-400 mb-1">손절가 (Stop)</p>
                      <p className="text-sm font-semibold text-white">
                        {session.stopPrice != null ? session.stopPrice.toLocaleString() : '-'}
                      </p>
                    </div>
                    <div className="bg-zinc-800 rounded-lg px-3 py-2">
                      <p className="text-xs text-zinc-400 mb-1">익절가 (TP)</p>
                      <p className="text-sm font-semibold text-white">
                        {session.tpPrice != null ? session.tpPrice.toLocaleString() : '-'}
                      </p>
                    </div>
                    <div className="bg-zinc-800 rounded-lg px-3 py-2">
                      <p className="text-xs text-zinc-400 mb-1">쿨다운 잔여 봉</p>
                      <p className="text-sm font-semibold text-white">{session.cooldownBarsLeft}</p>
                    </div>
                    <div className="bg-zinc-800 rounded-lg px-3 py-2">
                      <p className="text-xs text-zinc-400 mb-1">연속 손절 횟수</p>
                      <p className="text-sm font-semibold text-white">{session.consecSlCount}</p>
                    </div>
                    <div className="bg-zinc-800 rounded-lg px-3 py-2">
                      <p className="text-xs text-zinc-400 mb-1">현재 자산</p>
                      <p className="text-sm font-semibold text-white">{session.currentEquity.toFixed(6)}</p>
                    </div>
                    <div className="bg-zinc-800 rounded-lg px-3 py-2">
                      <p className="text-xs text-zinc-400 mb-1">최고 자산</p>
                      <p className="text-sm font-semibold text-white">{session.peakEquity.toFixed(6)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
